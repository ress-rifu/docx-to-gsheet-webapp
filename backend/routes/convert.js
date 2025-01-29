const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { google } = require('googleapis');
const router = express.Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.fields([{ name: 'docx' }, { name: 'json' }]), async (req, res) => {
  try {
    const docxFile = req.files['docx'][0];
    const jsonFile = req.files['json'][0];
    const sheetName = req.body.sheetName;

    // Path setup
    const docxPath = path.resolve(docxFile.path);
    const jsonPath = path.resolve(jsonFile.path);
    const texPath = path.resolve('uploads', `${Date.now()}-converted.tex`);

    // Convert docx to tex using Pandoc
    await new Promise((resolve, reject) => {
      exec(`pandoc "${docxPath}" -o "${texPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Pandoc error: ${stderr}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Parse the tex file to extract MCQs (Implement similar logic as in Python)
    const mcqData = parseLatexForMCQs(texPath);

    if (mcqData.length === 0) {
      return res.status(400).json({ message: 'No MCQs found in the document.' });
    }

    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      keyFile: jsonPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create a new spreadsheet
    const resource = {
      properties: {
        title: sheetName,
      },
    };

    const spreadsheet = await sheets.spreadsheets.create({
      resource,
      fields: 'spreadsheetId',
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Prepare data with headers
    const header = [
      "Serial",
      "For Class Slide",
      "For Lecture sheet",
      "For Quiz (Daily)",
      "For Quiz (Weekly)",
      "Question",
      "Topic",
      "Board/Inst",
      "Option ক",
      "Option খ",
      "Option গ",
      "Option ঘ",
      "Answer"
    ];

    const values = [header, ...mcqData];

    // Write data to the spreadsheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });

    // Cleanup uploaded and temporary files
    fs.unlinkSync(docxPath);
    fs.unlinkSync(jsonPath);
    fs.unlinkSync(texPath);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    res.json({ sheetUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during conversion.' });
  }
});

// Function to parse LaTeX file for MCQs
function parseLatexForMCQs(texPath) {
  const content = fs.readFileSync(texPath, 'utf-8');
  const lines = content.split('\n');

  const mcqData = [];
  let currentMCQ = null;

  const reQuestion = /^([\u09E6-\u09EF0-9]+)[.,]\s+(.*)$/;
  const reOption = /^([ক-ঘ])[.)]\s+(.*)$/;
  const reAnswer = /^উত্তর[:ঃ]\s+(.*)$/;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    let match = line.match(reQuestion);
    if (match) {
      if (currentMCQ) {
        mcqData.push(currentMCQ);
      }
      currentMCQ = {
        Serial: match[1],
        "For Class Slide": "",
        "For Lecture sheet": "",
        "For Quiz (Daily)": "",
        "For Quiz (Weekly)": "",
        "Question": match[2],
        "Topic": "",
        "Board/Inst": "",
        "Option ক": "",
        "Option খ": "",
        "Option গ": "",
        "Option ঘ": "",
        "Answer": ""
      };
      return;
    }

    if (currentMCQ) {
      match = line.match(reOption);
      if (match) {
        currentMCQ[`Option ${match[1]}`] = match[2];
        return;
      }

      match = line.match(reAnswer);
      if (match) {
        currentMCQ["Answer"] = match[1];
        return;
      }

      // Additional parsing for Topic and Board/Inst can be added here
      // Similar to the Python code's parse_bracket_tokens function
    }
  });

  if (currentMCQ) {
    mcqData.push(currentMCQ);
  }

  return mcqData.map(mcq => Object.values(mcq));
}

module.exports = router;
