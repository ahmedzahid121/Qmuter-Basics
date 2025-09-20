const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Initialize Firebase Admin SDK
const serviceAccount = require('../path/to/service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'your-project-id'
});

const db = admin.firestore();

// Configuration
const BATCH_SIZE = 500; // Firestore batch limit
const GTFS_PATH = path.join(__dirname, '../Routes');

async function importGTFSData() {
  console.log('🚀 Starting GTFS data import...');
  
  try {
    // Import stops
    await importStops();
    
    // Import routes
    await importRoutes();
    
    // Import agencies
    await importAgencies();
    
    // Import calendars
    await importCalendars();
    
    console.log('✅ GTFS data import completed successfully!');
  } catch (error) {
    console.error('❌ Error importing GTFS data:', error);
    process.exit(1);
  }
}

async function importStops() {
  console.log('📍 Importing stops...');
  
  const stops = [];
  const stopsPath = path.join(GTFS_PATH, 'stops.txt');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(stopsPath)
      .pipe(csv())
      .on('data', (row) => {
        stops.push({
          stop_id: row.stop_id,
          stop_code: row.stop_code,
          stop_name: row.stop_name,
          stop_lat: parseFloat(row.stop_lat),
          stop_lon: parseFloat(row.stop_lon),
          location_type: parseInt(row.location_type),
          parent_station: row.parent_station || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      })
      .on('end', async () => {
        try {
          await batchWrite('gtfs_stops', stops);
          console.log(`✅ Imported ${stops.length} stops`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importRoutes() {
  console.log('🚌 Importing routes...');
  
  const routes = [];
  const routesPath = path.join(GTFS_PATH, 'routes.txt');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(routesPath)
      .pipe(csv())
      .on('data', (row) => {
        routes.push({
          route_id: row.route_id,
          agency_id: row.agency_id,
          route_short_name: row.route_short_name,
          route_long_name: row.route_long_name,
          route_type: parseInt(row.route_type),
          route_color: row.route_color || null,
          route_text_color: row.route_text_color || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      })
      .on('end', async () => {
        try {
          await batchWrite('gtfs_routes', routes);
          console.log(`✅ Imported ${routes.length} routes`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importAgencies() {
  console.log('🏢 Importing agencies...');
  
  const agencies = [];
  const agenciesPath = path.join(GTFS_PATH, 'agency.txt');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(agenciesPath)
      .pipe(csv())
      .on('data', (row) => {
        agencies.push({
          agency_id: row.agency_id,
          agency_name: row.agency_name,
          agency_url: row.agency_url,
          agency_timezone: row.agency_timezone,
          agency_lang: row.agency_lang,
          agency_phone: row.agency_phone,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      })
      .on('end', async () => {
        try {
          await batchWrite('gtfs_agencies', agencies);
          console.log(`✅ Imported ${agencies.length} agencies`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function importCalendars() {
  console.log('📅 Importing calendars...');
  
  const calendars = [];
  const calendarsPath = path.join(GTFS_PATH, 'calendar.txt');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(calendarsPath)
      .pipe(csv())
      .on('data', (row) => {
        calendars.push({
          service_id: row.service_id,
          monday: parseInt(row.monday),
          tuesday: parseInt(row.tuesday),
          wednesday: parseInt(row.wednesday),
          thursday: parseInt(row.thursday),
          friday: parseInt(row.friday),
          saturday: parseInt(row.saturday),
          sunday: parseInt(row.sunday),
          start_date: row.start_date,
          end_date: row.end_date,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      })
      .on('end', async () => {
        try {
          await batchWrite('gtfs_calendars', calendars);
          console.log(`✅ Imported ${calendars.length} calendars`);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

async function batchWrite(collection, documents) {
  const batches = [];
  let batch = db.batch();
  let operationCount = 0;
  
  for (const doc of documents) {
    const docRef = db.collection(collection).doc(doc[`${collection.split('_')[1]}_id`] || doc.id);
    batch.set(docRef, doc);
    operationCount++;
    
    if (operationCount === BATCH_SIZE) {
      batches.push(batch);
      batch = db.batch();
      operationCount = 0;
    }
  }
  
  if (operationCount > 0) {
    batches.push(batch);
  }
  
  console.log(`📦 Writing ${documents.length} documents in ${batches.length} batches...`);
  
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`   Batch ${i + 1}/${batches.length} committed`);
  }
}

// Create indexes for better query performance
async function createIndexes() {
  console.log('🔍 Creating indexes...');
  
  const indexes = [
    {
      collection: 'gtfs_stops',
      fields: [
        { fieldPath: 'stop_lat', order: 'ASCENDING' },
        { fieldPath: 'stop_lon', order: 'ASCENDING' }
      ]
    },
    {
      collection: 'gtfs_stops',
      fields: [
        { fieldPath: 'stop_name', order: 'ASCENDING' }
      ]
    },
    {
      collection: 'gtfs_routes',
      fields: [
        { fieldPath: 'route_type', order: 'ASCENDING' }
      ]
    },
    {
      collection: 'gtfs_routes',
      fields: [
        { fieldPath: 'agency_id', order: 'ASCENDING' }
      ]
    }
  ];
  
  // Note: In production, you'd use the Firebase CLI to create indexes
  // firebase firestore:indexes
  console.log('📋 Indexes should be created using Firebase CLI');
  console.log('   Run: firebase firestore:indexes');
}

// Main execution
if (require.main === module) {
  importGTFSData()
    .then(() => createIndexes())
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  importGTFSData,
  createIndexes
}; 