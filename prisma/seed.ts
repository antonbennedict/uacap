import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter })

const DRUG_LIBRARY = [
  // Anti-Infectious (21)
  { genericName: 'Albendazole', salt: '', strength: '400mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00, qty: 50 },
  { genericName: 'Amoxicillin', salt: 'Trihydrate', strength: '500mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 3.50, qty: 150 },
  { genericName: 'Azithromycin', salt: 'Dihydrate', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 45.00, qty: 40 },
  { genericName: 'Cefixime', salt: '', strength: '200mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 18.00, qty: 60 },
  { genericName: 'Cefuroxime', salt: 'Axetil', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 25.00, qty: 50 },
  { genericName: 'Ciprofloxacin', salt: 'HCl', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.00, qty: 100 },
  { genericName: 'Clarithromycin', salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 30.00, qty: 80 },
  { genericName: 'Clindamycin', salt: 'HCl', strength: '300mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 12.00, qty: 60 },
  { genericName: 'Clotrimazole', salt: '', strength: '1%', form: 'Cream', unit: 'Tube', package: 'Tube of 5g', price: 120.00, qty: 25 },
  { genericName: 'Cloxacillin', salt: 'Sodium', strength: '500mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 6.00, qty: 80 },
  { genericName: 'Co-amoxiclav', salt: 'Amoxicillin + Potassium Clavulanate', strength: '625mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 35.00, qty: 120 },
  { genericName: 'Co-trimoxazole', salt: 'Sulfamethoxazole + Trimethoprim', strength: '800mg + 160mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00, qty: 100 },
  { genericName: 'Doxycycline', salt: 'Hyclate', strength: '100mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 7.00, qty: 90 },
  { genericName: 'Erythromycin', salt: 'Stearate', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00, qty: 50 },
  { genericName: 'Fluconazole', salt: '', strength: '150mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 10', price: 95.00, qty: 30 },
  { genericName: 'Ketoconazole', salt: '', strength: '2%', form: 'Cream', unit: 'Tube', package: 'Tube of 10g', price: 180.00, qty: 20 },
  { genericName: 'Mebendazole', salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 10.00, qty: 50 },
  { genericName: 'Metronidazole', salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50, qty: 80 },
  { genericName: 'Nitrofurantoin', salt: 'Macrocrystals', strength: '100mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 22.00, qty: 100 },
  { genericName: 'Oseltamivir', salt: 'Phosphate', strength: '75mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 10', price: 140.00, qty: 15 },
  { genericName: 'Tobramycin', salt: '', strength: '0.3%', form: 'Eye Drops', unit: 'Bottle', package: 'Bottle of 5ml', price: 250.00, qty: 20 },

  // Anti-Hypertensive & Cardiology (18)
  { genericName: 'Amlodipine', salt: 'Besilate', strength: '5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.00, qty: 200 },
  { genericName: 'Atenolol', salt: '', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50, qty: 60 },
  { genericName: 'Captopril', salt: '', strength: '25mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50, qty: 80 },
  { genericName: 'Clonidine', salt: 'HCl', strength: '75mcg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00, qty: 40 },
  { genericName: 'Diltiazem', salt: 'HCl', strength: '60mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 15.00, qty: 50 },
  { genericName: 'Enalapril', salt: 'Maleate', strength: '5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.00, qty: 150 },
  { genericName: 'Enalapril + Hydrochlorothiazide', salt: 'Maleate + Hydrochlorothiazide', strength: '20mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 12.00, qty: 40 },
  { genericName: 'Hydrochlorothiazide', salt: '', strength: '25mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50, qty: 150 },
  { genericName: 'Isosorbide Dinitrate', salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 14.00, qty: 30 },
  { genericName: 'Isosorbide Mononitrate', salt: '', strength: '30mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 11.00, qty: 50 },
  { genericName: 'Losartan', salt: 'Potassium', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00, qty: 250 },
  { genericName: 'Methyldopa', salt: '', strength: '250mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 9.00, qty: 40 },
  { genericName: 'Metoprolol', salt: 'Succinate', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50, qty: 150 },
  { genericName: 'Tamsulosin', salt: 'HCl', strength: '400mcg', form: 'Capsule', unit: 'Capsule', package: 'Box of 30', price: 28.00, qty: 60 },
  { genericName: 'Telmisartan', salt: '', strength: '40mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 16.00, qty: 70 },
  { genericName: 'Telmisartan + Hydrochlorothiazide', salt: '', strength: '40mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 20.00, qty: 50 },
  { genericName: 'Valsartan', salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 18.00, qty: 60 },
  { genericName: 'Valsartan + Hydrochlorothiazide', salt: '', strength: '80mg + 12.5mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 24.00, qty: 45 },

  // Anti-Asthma & COPD (8)
  { genericName: 'Budesonide + Formoterol', salt: '', strength: '160mcg + 4.5mcg', form: 'Inhaler', unit: 'Inhaler', package: '120 doses', price: 850.00, qty: 15 },
  { genericName: 'Fluticasone + Salmeterol', salt: '', strength: '250mcg + 50mcg', form: 'Inhaler', unit: 'Inhaler', package: '60 doses', price: 650.00, qty: 25 },
  { genericName: 'Ipratropium', salt: 'Bromide', strength: '250mcg/ml', form: 'Nebulizing Solution', unit: 'Nebule', package: 'Box of 20', price: 25.00, qty: 80 },
  { genericName: 'Ipratropium + Salbutamol', salt: '', strength: '500mcg + 2.5mg', form: 'Nebulizing Solution', unit: 'Nebule', package: 'Box of 30', price: 18.00, qty: 100 },
  { genericName: 'Montelukast', salt: 'Sodium', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 15.00, qty: 120 },
  { genericName: 'Prednisone', salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50, qty: 150 },
  { genericName: 'Salbutamol', salt: 'Sulfate', strength: '2mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50, qty: 300 },
  { genericName: 'Tiotropium', salt: 'Bromide', strength: '18mcg', form: 'Rotacap', unit: 'Capsule', package: 'Box of 30', price: 45.00, qty: 30 },

  // Anti-Diabetics (3)
  { genericName: 'Dapagliflozin', salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 30', price: 38.00, qty: 80 },
  { genericName: 'Gliclazide', salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.00, qty: 150 },
  { genericName: 'Metformin', salt: 'HCl', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.80, qty: 400 },

  // Anti-Dyslipidemia (4)
  { genericName: 'Atorvastatin', salt: 'Calcium', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 10.00, qty: 150 },
  { genericName: 'Fenofibrate', salt: '', strength: '160mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 30', price: 22.00, qty: 60 },
  { genericName: 'Rosuvastatin', salt: 'Calcium', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 14.00, qty: 120 },
  { genericName: 'Simvastatin', salt: '', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00, qty: 180 },

  // Anti-Thrombotics (2)
  { genericName: 'Aspirin', salt: '', strength: '80mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50, qty: 250 },
  { genericName: 'Clopidogrel', salt: 'Bisulfate', strength: '75mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 6.50, qty: 100 },

  // Nervous System (1)
  { genericName: 'Gabapentin', salt: '', strength: '300mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 16.00, qty: 80 },

  // Supportive/Other Therapy (18)
  { genericName: 'Aluminum Hydroxide + Magnesium Hydroxide', salt: '', strength: '200mg + 200mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.00, qty: 150 },
  { genericName: 'Butamirate', salt: 'Citrate', strength: '50mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 18.00, qty: 60 },
  { genericName: 'Celecoxib', salt: '', strength: '200mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 8.50, qty: 100 },
  { genericName: 'Cetirizine', salt: 'Dihydrochloride', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50, qty: 150 },
  { genericName: 'Chlorphenamine', salt: 'Maleate', strength: '4mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.00, qty: 200 },
  { genericName: 'Colchicine', salt: '', strength: '500mcg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 5.50, qty: 80 },
  { genericName: 'Diphenhydramine', salt: 'HCl', strength: '50mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 2.05, qty: 100 },
  { genericName: 'Ferrous Salt', salt: 'Sulfate', strength: '325mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.50, qty: 250 },
  { genericName: 'Folic Acid + Iron Ferrous', salt: '', strength: '400mcg + 60mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50, qty: 200 },
  { genericName: 'Ibuprofen', salt: '', strength: '400mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.00, qty: 150 },
  { genericName: 'Lagundi', salt: 'Vitex negundo', strength: '600mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 6.00, qty: 180 },
  { genericName: 'Loratadine', salt: '', strength: '10mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 3.50, qty: 120 },
  { genericName: 'Mefenamic Acid', salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 2.50, qty: 300 },
  { genericName: 'Naproxen', salt: 'Sodium', strength: '550mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 8.00, qty: 90 },
  { genericName: 'Omeprazole', salt: '', strength: '20mg', form: 'Capsule', unit: 'Capsule', package: 'Box of 100', price: 5.00, qty: 150 },
  { genericName: 'Oral Rehydration Salts', salt: 'Anhydrous Glucose + Sodium Chloride + etc', strength: '20.5g', form: 'Sachet', unit: 'Sachet', package: 'Box of 25', price: 7.00, qty: 100 },
  { genericName: 'Paracetamol', salt: '', strength: '500mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 1.00, qty: 500 },
  { genericName: 'Zinc', salt: 'Sulfate', strength: '20mg', form: 'Tablet', unit: 'Tablet', package: 'Box of 100', price: 4.50, qty: 150 },
];

async function main() {
  console.log('Seeding database...')

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      name: 'PhilHealth Administrator',
      role: 'Clinic Admin',
    },
  })

  console.log('Admin user seeded:', admin.username)

  // 2. Seed standard drug library
  console.log('Seeding drug library...');
  let count = 0;
  for (const drug of DRUG_LIBRARY) {
    const existing = await prisma.medicine.findFirst({
      where: {
        genericName: drug.genericName,
        strength: drug.strength,
        dosageForm: drug.form
      }
    });

    if (!existing) {
      await prisma.medicine.create({
        data: {
          genericName: drug.genericName,
          salt: drug.salt,
          strength: drug.strength,
          dosageForm: drug.form,
          unit: drug.unit,
          package: drug.package,
          quantity: drug.qty,
          actualUnitPrice: drug.price,
          stockStatus: drug.qty >= 20 ? 'Adequate' : drug.qty > 0 ? 'Low' : 'Out of Stock'
        }
      });
      count++;
    }
  }

  console.log(`Drug library seeded: ${count} medicines added.`);
  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
