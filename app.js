const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

//Authentication Token--------------------------------------------------------------------------

const authenticateToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        console.error('Authorization header missing');
        return res.sendStatus(401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.error('Token missing in authorization header');
        return res.sendStatus(401);
    }

    try {
        const response = await axios.post('https://sso.indhi.io/api/user', {}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.status === 200) {
            req.user = response.data;
            return next();
        } else {
            console.error('Token authentication failed with status:', response.status);
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error('Error in token authentication:', error.message);
        return res.sendStatus(500);
    }
};

//Organizations------------------------------------------------------------------------------------

app.post('/org', authenticateToken, (req, res) => {
    const { org_name, description, time_zone } = req.body;
    if (!org_name || !description || !time_zone) {
        return res.status(400).json({
            error: 'The name of the organization, description, and the time zone are required fields.'
        });
    }
   //org_id auto increment primary 
    db.query('INSERT INTO organizations (org_name, description, time_zone) VALUES (?, ?, ?)',
        [org_name, description, time_zone],
        (err, results) => {
            if (err) {
                console.error('Error creating organization:', err.message);
                return res.status(500).json({ error: 'Internal server error' });
            } else {
                const org_id = results.insertId;
                return res.status(201).json({ org_id, org_name, description, time_zone });
            }
        }
    );
});

app.get('/org', (req, res) => {
    db.query('SELECT * FROM organizations', (err, results) => {
        if (err) {
            console.error('Error fetching organizations:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        } else {
            return res.json({ organizations: results });
        }
    });
});

//Space----------------------------------------------------------------------------------------------

app.post('/space', authenticateToken, (req, res) => {
    const { space_name, description, space_date, org_id } = req.body;
    if (!space_name || !description || !space_date) {
        return res.status(400).json({
            error: 'All fields are required'
        });
    }

    db.query('INSERT INTO spaces (space_name, description, space_date) VALUES (?, ?, ?)',
        [space_name, description, space_date],
        (err, results) => {
            if (err) {
                console.error('Error creating space: ', err.message);
                return res.status(500).json({ error: 'Internal server error' });
            } else {
                const space_id = results.insertId;
                return res.status(201).json({ space_id, space_name, description, space_date, org_id });
            }
        });
});

app.get('/spaces', (req, res) => {
    db.query('SELECT * FROM spaces', (err, results) => {
        if (err) {
            console.error('Error fetching spaces:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        } else {
            return res.json({ spaces: results });
        }
    });
});

//Device---------------------------------------------------------------------------------------------

app.post('/device', authenticateToken, (req,res) => {
    db.query('INSERT INTO deices (device_name, description, device_time) VALUES (?, ?, ?)'
        [device_name, description, device_date],
        (err, results) => {
            if (err) {
              console.error('Error in creating devices: ', err.message);
              return res.status(500).json({error: 'Internal srver error'})
            }  else {
                   const device_id =  results.insertId;
                return res.status(201).json({device_id, device_name, description, device_date, org_id})
            }
        });
});

app.get('/device', (req,res) => {
    db.query('SELECT * FROM devices', (err, results) => {
        if(err) {
            console.log('Error fetching devices:', err.message);
            return res.status(500).json({error: 'Internal server error'});
            } else {
                return res.json({devices: results});
        }
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});