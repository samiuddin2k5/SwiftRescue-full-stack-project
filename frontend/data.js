import h1 from "../src/assets/images/abbasi_real_photo_1780151722802.png";
import h2 from "../src/assets/images/ziauddin_hosp_1780151500869.png";
import h3 from "../src/assets/images/imam_clinic_real_photo_1780151748912.png";
import h4 from "../src/assets/images/liaquat_national_hosp_1780151547543.png";
import h5 from "../src/assets/images/aga_khan_real_photo_1780166010222.png";
import h6 from "../src/assets/images/jpmc_real_photo_1780166031657.png";
import h7 from "../src/assets/images/nicvd_real_photo_1780166052684.png";
import h8 from "../src/assets/images/civil_hosp_real_photo_1780166077609.png";
import h9 from "../src/assets/images/dow_hosp_real_photo_1780166096635.png";
import h10 from "../src/assets/images/patel_hosp_real_photo_1780166116651.png";
import h11 from "../src/assets/images/indus_hosp_real_photo_1780166140969.png";

export const MOCK_AMBULANCES = [
  {
    id: "amb_01",
    plateNumber: "TX-942-MED",
    driverName: "Ahmed",
    driverPhone: "+92 300 1234567",
    rating: 4.9,
    etaMinutes: 10,
    currentSpeedKph: 52,
  },
  {
    id: "amb_02",
    plateNumber: "CA-118-EMS",
    driverName: "Ali",
    driverPhone: "+92 321 9876543",
    rating: 4.8,
    etaMinutes: 11,
    currentSpeedKph: 48,
  },
  {
    id: "amb_03",
    plateNumber: "NY-502-RESC",
    driverName: "Kamran",
    driverPhone: "+92 333 5556667",
    rating: 5.0,
    etaMinutes: 10,
    currentSpeedKph: 55,
  },
  {
    id: "amb_04",
    plateNumber: "FL-883-LIFE",
    driverName: "Muhammad",
    driverPhone: "+92 312 8889990",
    rating: 4.7,
    etaMinutes: 12,
    currentSpeedKph: 44,
  },
  {
    id: "amb_05",
    plateNumber: "IL-602-ER",
    driverName: "Hamza",
    driverPhone: "+92 345 1112223",
    rating: 4.9,
    etaMinutes: 10,
    currentSpeedKph: 50,
  }
];

export const MOCK_HOSPITALS = [
  {
    id: "hosp_metro",
    name: "🏥 Abbasi Shaheed Hospital (Nazimabad No. 3)",
    distanceKm: 2.1,
    availableBeds: 28,
    availableIcuBeds: 5,
    assignedRoom: "ER Trauma Ward - Bed 9",
    onDutyDoctor: "Dr. Muhammad Irfan",
    rating: 4.8,
    latitude: 220,
    longitude: 80,
    imageUrl: h1,
  },
  {
    id: "hosp_mercy",
    name: "🏥 Ziauddin University Hospital (North Nazimabad)",
    distanceKm: 3.4,
    availableBeds: 18,
    availableIcuBeds: 4,
    assignedRoom: "ICU Specialist Unit 3",
    onDutyDoctor: "Dr. Saulat Sharif",
    rating: 4.9,
    latitude: 60,
    longitude: 320,
    imageUrl: h2,
  },
  {
    id: "hosp_st_jude",
    name: "🏥 Imam Clinic & Hospital (Five Star Chowrangi)",
    distanceKm: 4.2,
    availableBeds: 12,
    availableIcuBeds: 2,
    assignedRoom: "Resuscitation Unit A",
    onDutyDoctor: "Dr. Farhan Yousuf",
    rating: 4.7,
    latitude: 380,
    longitude: 170,
    imageUrl: h3,
  },
  {
    id: "hosp_valley",
    name: "🏥 Liaquat National Hospital (Stadium Road)",
    distanceKm: 5.8,
    availableBeds: 22,
    availableIcuBeds: 7,
    assignedRoom: "Emergency Resus Wing B",
    onDutyDoctor: "Dr. Zainab Zaidi",
    rating: 4.9,
    latitude: 330,
    longitude: 380,
    imageUrl: h4,
  },
  {
    id: "hosp_aga_khan",
    name: "🏥 Aga Khan University Hospital (Stadium Road)",
    distanceKm: 6.2,
    availableBeds: 35,
    availableIcuBeds: 9,
    assignedRoom: "Cardiac Critical Care - Bay 4",
    onDutyDoctor: "Dr. Adeel Hashmi",
    rating: 5.0,
    latitude: 190,
    longitude: 280,
    imageUrl: h5,
  },
  {
    id: "hosp_jpmc",
    name: "🏥 Jinnah Postgraduate Medical Centre (Karachi Cantt)",
    distanceKm: 7.5,
    availableBeds: 45,
    availableIcuBeds: 10,
    assignedRoom: "Trauma General Ward - Bed 14",
    onDutyDoctor: "Dr. Seema Jamali",
    rating: 4.6,
    latitude: 140,
    longitude: 220,
    imageUrl: h6,
  },
  {
    id: "hosp_nicvd",
    name: "🏥 National Institute of Cardiovascular Diseases (Saddar)",
    distanceKm: 8.1,
    availableBeds: 40,
    availableIcuBeds: 12,
    assignedRoom: "Emergency Cardiac Rehab A",
    onDutyDoctor: "Dr. Nadeem Qamar",
    rating: 4.8,
    latitude: 150,
    longitude: 190,
    imageUrl: h7,
  },
  {
    id: "hosp_civil",
    name: "🏥 Dr. Ruth K.M. Pfau Civil Hospital (Saddar)",
    distanceKm: 8.9,
    availableBeds: 50,
    availableIcuBeds: 8,
    assignedRoom: "Burns & Trauma Center - Desk 3",
    onDutyDoctor: "Dr. Khalid Masood",
    rating: 4.5,
    latitude: 90,
    longitude: 120,
    imageUrl: h8,
  },
  {
    id: "hosp_dow_ojha",
    name: "🏥 Dow University Hospital - Ojha Campus (Gulzar-e-Hijri)",
    distanceKm: 9.3,
    availableBeds: 30,
    availableIcuBeds: 6,
    assignedRoom: "High Dependency Unit B - Bed 2",
    onDutyDoctor: "Dr. Saeed Malik",
    rating: 4.8,
    latitude: 290,
    longitude: 330,
    imageUrl: h9,
  },
  {
    id: "hosp_patel",
    name: "🏥 Patel Hospital (Gulshan-e-Iqbal)",
    distanceKm: 5.1,
    availableBeds: 15,
    availableIcuBeds: 3,
    assignedRoom: "Isolation Ward Wing C",
    onDutyDoctor: "Dr. Anjum Rizvi",
    rating: 4.7,
    latitude: 250,
    longitude: 250,
    imageUrl: h10,
  },
  {
    id: "hosp_indus",
    name: "🏥 Indus Hospital (Korangi Crossing)",
    distanceKm: 11.2,
    availableBeds: 32,
    availableIcuBeds: 5,
    assignedRoom: "Pediatrics ER Trauma Unit",
    onDutyDoctor: "Dr. Abdul Bari Khan",
    rating: 4.9,
    latitude: 350,
    longitude: 290,
    imageUrl: h11,
  }
];

export const FIRST_AID_SUGGESTIONS = {
  "Cardiac Arrest": [
    "Perform immediate high-quality continuous CPR (Chest Compressions).",
    "Keep compression pace at 110 beats per minute on center of sternum.",
    "Locate nearest public AED and follow instructions.",
    "Do not stop compressions until paramedic team cross-verifies pulse."
  ],
  "Severe Trauma / Accident": [
    "Apply firm direct pressure to bleeding orifices using a sterile pad or clean cloth.",
    "Do not move the patient unless immediate environment is hazardous.",
    "Support neck immobility if spinal trauma is suspected.",
    "Keep patient warm with blanket to combat medical shock."
  ],
  "Asthma Attack / Respiratory": [
    "Help patient sit in an upright position. Do not force them to lie down.",
    "Assist with emergency rescue inhaler dosage (usually albuterol blue puffer).",
    "Loosen tight ties, collars or restrictive clothing around throat.",
    "Guide slow pursed-lip rhythmic breathing to combat hyperventilation."
  ],
  "Stroke / Neurological": [
    "Keep patient sitting or lying in a recovery safety position.",
    "Ask patient simple questions to test slurred speech levels.",
    "Record exact time signs first emerged for critical tPA injection windows.",
    "Do not administer fluids, food or aspirin to prevent choking hazards."
  ],
  "Severe Impairment / Poison": [
    "Identify bottle, label, or substance name immediately.",
    "Keep conscious patients upright to ensure proper airway ventilation.",
    "Do not induce vomiting unless explicitly trained/guided by toxicologists.",
    "Be prepared to perform basic respiratory resuscitation if patient lapses."
  ],
  "Other Emergency": [
    "Perform secondary safety diagnostics (assess airway, breathing, pulse).",
    "Protect patient from environmental hazards (cold, direct heat, moisture).",
    "Avoid giving patient food, hot beverages or painkillers.",
    "Keep communication active until dispatch alerts are marked arrived."
  ]
};
