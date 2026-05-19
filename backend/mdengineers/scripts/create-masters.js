#!/usr/bin/env node

/**
 * Quick Master Data Creation Script
 * Creates Customers and Particulars in Railway database
 * Usage: node create-masters.js <admin_token>
 */

const http = require('http');
const https = require('https');

const API_BASE = process.env.API_URL || 'https://m-and-d-engineering-production.up.railway.app/api';
const TOKEN = process.argv[2] || process.env.AUTH_TOKEN;

if (!TOKEN) {
  console.error('❌ Error: No auth token provided!');
  console.error('\nUsage:');
  console.error('  node create-masters.js <admin_token>');
  console.error('\nOr set AUTH_TOKEN env variable:');
  console.error('  export AUTH_TOKEN=your_token');
  console.error('  node create-masters.js');
  process.exit(1);
}

const CUSTOMERS = [
  {
    customer_code: 'DEV-001',
    name: 'Devanshu Dandekar',
    contact_person: 'Devanshu',
    email: 'vrushalidandekar4@gmail.com',
    phone: '+919594193572',
    gst_number: '',
    pan_number: '',
    payment_terms_days: 30,
    credit_limit: 100000,
    billing_address: 'Pune, India',
    shipping_address: 'Pune, India',
    is_active: true
  },
  {
    customer_code: 'ABC-001',
    name: 'ABC Corporation',
    contact_person: 'Manager ABC',
    email: 'info@abc.com',
    phone: '+919876543210',
    gst_number: '27ABCDE1234F1Z5',
    pan_number: 'ABCPD1234A',
    payment_terms_days: 30,
    credit_limit: 500000,
    billing_address: 'Mumbai, India',
    shipping_address: 'Mumbai, India',
    is_active: true
  }
];

const PARTICULARS = [
  {
    particular_code: 'SD-001',
    name: 'Software Development',
    description: 'Custom software development services',
    hsn_code: '998360',
    sac_code: '998360',
    unit: 'hrs',
    default_unit_price: 5000,
    tax_applicable: true,
    tax_rate: 18,
    is_active: true
  },
  {
    particular_code: 'WD-001',
    name: 'Website Design',
    description: 'Website design and UI/UX services',
    hsn_code: '998361',
    sac_code: '998361',
    unit: 'project',
    default_unit_price: 50000,
    tax_applicable: true,
    tax_rate: 18,
    is_active: true
  },
  {
    particular_code: 'PM-001',
    name: 'Project Management',
    description: 'Project management and consulting',
    hsn_code: '998362',
    sac_code: '998362',
    unit: 'hrs',
    default_unit_price: 2000,
    tax_applicable: true,
    tax_rate: 18,
    is_active: true
  },
  {
    particular_code: 'CONS-001',
    name: 'Consultation',
    description: 'Technical and business consultation',
    hsn_code: '998363',
    sac_code: '998363',
    unit: 'hrs',
    default_unit_price: 1500,
    tax_applicable: true,
    tax_rate: 18,
    is_active: true
  }
];

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createMasters() {
  console.log('\n' + '='.repeat(70));
  console.log('     M&D ENGINEERS - MASTER DATA CREATION');
  console.log('='.repeat(70) + '\n');

  console.log(`🔌 API Base: ${API_BASE}`);
  console.log(`🔑 Token: ${TOKEN.substring(0, 20)}...`);
  console.log('\n');

  // Create customers
  console.log('👥 Creating Customers...\n');
  let customerCount = 0;

  for (const customer of CUSTOMERS) {
    try {
      const response = await makeRequest('POST', '/customers', customer);
      
      if (response.status === 201 || response.status === 200) {
        console.log(`  ✅ ${customer.name}`);
        console.log(`     Code: ${customer.customer_code}`);
        console.log(`     Email: ${customer.email}\n`);
        customerCount++;
      } else {
        console.log(`  ⚠️  ${customer.name}`);
        console.log(`     Status: ${response.status}`);
        console.log(`     Message: ${response.data?.message || 'Unknown error'}\n`);
      }
    } catch (error) {
      console.log(`  ❌ ${customer.name}: ${error.message}\n`);
    }
  }

  // Create particulars
  console.log('\n📦 Creating Particulars...\n');
  let particularCount = 0;

  for (const particular of PARTICULARS) {
    try {
      const response = await makeRequest('POST', '/particulars', particular);
      
      if (response.status === 201 || response.status === 200) {
        console.log(`  ✅ ${particular.name}`);
        console.log(`     Code: ${particular.particular_code}`);
        console.log(`     Price: ₹${particular.default_unit_price}/${particular.unit}\n`);
        particularCount++;
      } else {
        console.log(`  ⚠️  ${particular.name}`);
        console.log(`     Status: ${response.status}`);
        console.log(`     Message: ${response.data?.message || 'Unknown error'}\n`);
      }
    } catch (error) {
      console.log(`  ❌ ${particular.name}: ${error.message}\n`);
    }
  }

  console.log('='.repeat(70));
  console.log('✅ CREATION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Customers created: ${customerCount}/${CUSTOMERS.length}`);
  console.log(`   ✅ Particulars created: ${particularCount}/${PARTICULARS.length}`);
  console.log(`\n🎉 Master data is ready! Now you can create bills.\n`);
}

createMasters().catch(console.error);
