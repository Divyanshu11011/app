const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = 3001;

app.use(fileUpload());
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.json());

let storedEmail = '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'choudhardiv@gmail.com', // Replace with your Gmail email address
    pass: 'fsgp ymqe nipk wipv', // Replace with your Gmail password
  },
});

app.post('/process-captured-image-client', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.image;
    const uploadsDir = path.join(__dirname, 'uploads'); // Adjust the path accordingly
    const uploadPath = path.join(uploadsDir, uploadedFile.name);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileBuffer = uploadedFile.data;

    fs.writeFile(uploadPath, fileBuffer, (err) => {
      if (err) throw err;
      console.log(`Captured image saved to: ${uploadPath}`);

      res.json({ message: 'Image processed successfully.', filePath: uploadPath });
    });
  } catch (error) {
    console.error('Error processing captured image on client-side:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/process-file', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.image;
    const uploadsDir = path.join(__dirname, '..', 'python-scripts', 'uploads');
    const uploadPath = path.join(uploadsDir, uploadedFile.name);

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileBuffer = uploadedFile.data;

    fs.writeFile(uploadPath, fileBuffer, (err) => {
      if (err) throw err;
      console.log(`File saved to: ${uploadPath}`);

      const scriptPath = path.join(__dirname, '..', 'python-scripts', 'main.py');
      console.log('Python code running');

      exec(`python "${path.resolve(scriptPath)}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running Python script: ${error.message}`);
          return res.status(500).send('Internal Server Error');
        }

        console.log(`Python script output: ${stdout}`);
        console.error(`Python script errors: ${stderr}`);
        console.log('Python code ended');

        // Send confirmation email
        sendConfirmationEmail(storedEmail);

        res.json({ message: 'File uploaded successfully.', filePath: `/python-scripts/uploads/${uploadedFile.name}` });
      });
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/submit-email', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email not provided' });
    }

    // Update storedEmail with the submitted email
    storedEmail = email;

    // Perform the email submission logic here
    console.log('Email submitted:', email);

    // Adding a log to check if this line is reached
    console.log('After email submission logic');

    // Send a confirmation email or perform additional logic as needed
    sendConfirmationEmail(storedEmail);

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting email to the server:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/capture-image', async (req, res) => {
  try {
    // Construct the correct path to the Python script
    const pythonScriptPath = path.join(__dirname, '..', 'python-scripts', 'main.py');

    // Execute the Python script to capture an image
    exec(`python "${pythonScriptPath}" on_point_to_camera_button_click`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running Python script: ${error.message}`);
        return res.status(500).send('Internal Server Error');
      }

      console.log(`Python script output: ${stdout}`);
      console.error(`Python script errors: ${stderr}`);
      
      // Send confirmation email
      sendConfirmationEmail(storedEmail);

      res.json({ message: 'Image captured successfully.' });
    });
  } catch (error) {
    console.error('Error capturing image:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/latest-data', (req, res) => {
  try {
    const jsonOutputPath = path.join(__dirname, 'info.json');
    if (fs.existsSync(jsonOutputPath)) {
      const infoData = fs.readFileSync(jsonOutputPath, 'utf-8');
      res.json({ data: JSON.parse(infoData) });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error reading latest data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const sendConfirmationEmail = (email) => {
  if (!email) return;

  const mailDetails = {
    from: 'choudhardiv@gmail.com',
    to: email,
    subject: 'Document Verification Successful',
    text: 'Your document verification has been successful. Thank you for using our service!',
  };

  transporter.sendMail(mailDetails, (err, data) => {
    if (err) {
      console.log('Error Occurs:', err);
    } else {
      console.log('Email sent successfully');
    }
  });
};
