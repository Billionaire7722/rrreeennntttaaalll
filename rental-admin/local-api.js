const http = require('http');
const fs = require('fs');
const path = require('path');

const HOUSE_JSON_PATH = path.join(__dirname, 'data', 'house.json');

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/add-house') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const rawData = fs.readFileSync(HOUSE_JSON_PATH, 'utf-8');
                let houses = {};
                if (rawData.trim()) {
                    houses = JSON.parse(rawData);
                }

                const newProperty = JSON.parse(body);
                const newId = newProperty.id || Date.now().toString();

                houses[newId] = {
                    name: newProperty.title || "",
                    address: newProperty.address || "",
                    district: "",
                    city: "",
                    latitude: newProperty.latitude?.toString() || "",
                    longitude: newProperty.longitude?.toString() || "",
                    price: newProperty.price?.toString() || "",
                    payment_method: "",
                    bedrooms: newProperty.bedrooms?.toString() || "",
                    square: newProperty.area?.toString() || "",
                    image_url_1: newProperty.images?.[0] || "",
                    image_url_2: newProperty.images?.[1] || "",
                    image_url_3: newProperty.images?.[2] || "",
                    image_url_4: newProperty.images?.[3] || "",
                    image_url_5: newProperty.images?.[4] || "",
                    image_url_6: newProperty.images?.[5] || "",
                    decription: newProperty.description || ""
                };

                fs.writeFileSync(HOUSE_JSON_PATH, JSON.stringify(houses, null, 2), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: newId }));
            } catch (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Local API running on http://localhost:${PORT}`);
});
