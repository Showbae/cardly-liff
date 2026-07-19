import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
})

// ── Category definitions ────────────────────────────────────────
const CATEGORIES = [
  { name_th: 'คาเฟ่',             name_eng: 'Cafe',               icon: '☕',  sort_order: 1  },
  { name_th: 'ร้านอาหาร',         name_eng: 'Restaurant',         icon: '🍜', sort_order: 2  },
  { name_th: 'ซูเปอร์มาร์เก็ต',   name_eng: 'Supermarket',        icon: '🛒', sort_order: 3  },
  { name_th: 'น้ำมัน',             name_eng: 'Fuel',               icon: '⛽', sort_order: 4  },
  { name_th: 'ช้อปปิ้ง',           name_eng: 'Shopping',           icon: '🛍️', sort_order: 5  },
  { name_th: 'โรงพยาบาล',         name_eng: 'Hospital',           icon: '🏥', sort_order: 6  },
  { name_th: 'ร้านขายยา',          name_eng: 'Pharmacy',           icon: '💊', sort_order: 7  },
  { name_th: 'ร้านสะดวกซื้อ',      name_eng: 'Convenience Store',  icon: '🏪', sort_order: 8  },
  { name_th: 'โรงแรม',             name_eng: 'Hotel',              icon: '🏨', sort_order: 9  },
  { name_th: 'สายการบิน',           name_eng: 'Airline',            icon: '✈️', sort_order: 10 },
  { name_th: 'ขนส่ง',              name_eng: 'Transport',          icon: '🚗', sort_order: 11 },
  { name_th: 'บันเทิง',            name_eng: 'Entertainment',      icon: '🎬', sort_order: 12 },
  { name_th: 'ความงาม & สปา',      name_eng: 'Beauty & Spa',       icon: '💆', sort_order: 13 },
  { name_th: 'ฟู้ดดิลิเวอรี',      name_eng: 'Food Delivery',      icon: '🛵', sort_order: 14 },
  { name_th: 'ออนไลน์',            name_eng: 'Online',             icon: '🌐', sort_order: 15 },
  { name_th: 'อิเล็กทรอนิกส์',     name_eng: 'Electronics',        icon: '📱', sort_order: 16 },
]

// ── Merchant definitions ────────────────────────────────────────
// mcc_code: 4-digit Visa/Mastercard Merchant Category Code
// Notes on edge cases are inline where MCC choice is non-obvious
const MERCHANTS = [
  // Cafe — counter-service → 5814, table-service → 5812
  { name_th: 'สตาร์บัคส์',                           name_eng: 'Starbucks',                          mcc_code: '5814', category: 'Cafe' },
  { name_th: 'คาเฟ่ อเมซอน',                         name_eng: 'Amazon Coffee',                      mcc_code: '5814', category: 'Cafe' },
  { name_th: 'อินทนิล คอฟฟี่',                       name_eng: 'Inthanin Coffee',                    mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ทรู คอฟฟี่',                           name_eng: 'True Coffee',                        mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ปุณณ์ไทย คอฟฟี่',                      name_eng: 'Punthai Coffee',                     mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ชาวดอย',                                name_eng: 'Chao Doi Coffee',                    mcc_code: '5814', category: 'Cafe' },
  { name_th: 'วาวี คอฟฟี่',                          name_eng: 'Wawee Coffee',                       mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ดอยช้าง คอฟฟี่',                       name_eng: 'Doi Chaang Coffee',                  mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ลัคกิน คอฟฟี่',                        name_eng: 'Luckin Coffee',                      mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ทิม ฮอร์ตันส์',                         name_eng: 'Tim Hortons',                        mcc_code: '5814', category: 'Cafe' },
  { name_th: 'ดังกิ้น',                               name_eng: "Dunkin'",                            mcc_code: '5814', category: 'Cafe' },
  { name_th: 'แบล็คแคนยอน คอฟฟี่',                   name_eng: 'Black Canyon Coffee',                mcc_code: '5812', category: 'Cafe' },
  { name_th: 'คอฟฟี่ เวิลด์',                         name_eng: 'Coffee World',                       mcc_code: '5812', category: 'Cafe' },
  { name_th: 'เดอะ คอฟฟี่ บีน แอนด์ ที ลีฟ',          name_eng: 'The Coffee Bean & Tea Leaf',         mcc_code: '5812', category: 'Cafe' },
  { name_th: 'โรสต์ คอฟฟี่',                         name_eng: 'Roast Coffee',                       mcc_code: '5812', category: 'Cafe' },
  { name_th: 'เดอะ คอฟฟี่ คลับ',                      name_eng: 'The Coffee Club',                    mcc_code: '5812', category: 'Cafe' },

  // Restaurant — fast food 5814, full-service 5812
  { name_th: 'แมคโดนัลด์',                            name_eng: "McDonald's",                         mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'เคเอฟซี',                               name_eng: 'KFC',                                mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'เบอร์เกอร์ คิง',                        name_eng: 'Burger King',                        mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'ซับเวย์',                                name_eng: 'Subway',                             mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'มิสเตอร์ โดนัท',                        name_eng: 'Mister Donut',                       mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'อันตี้ แอนน์',                          name_eng: "Auntie Anne's",                      mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'แดรี่ ควีน',                             name_eng: 'Dairy Queen',                        mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'มอส เบอร์เกอร์',                         name_eng: 'Mos Burger',                         mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'โยชิโนยะ',                               name_eng: 'Yoshinoya',                          mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'เชสเตอร์ กริลล์',                       name_eng: "Chester's Grill",                    mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'โพเพยส์',                                name_eng: 'Popeyes',                            mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'ครีสปี้ ครีม',                          name_eng: 'Krispy Kreme',                       mcc_code: '5814', category: 'Restaurant' },
  { name_th: 'เอ็มเค เรสโตรองท์',                     name_eng: 'MK Restaurant',                      mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'โคคา เรสโตรองท์',                       name_eng: 'Coca Restaurant',                    mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'ฟูจิ เรสโตรองท์',                       name_eng: 'Fuji Restaurant',                    mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'ซิซเลอร์',                               name_eng: 'Sizzler',                            mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'บอนชอน',                                 name_eng: 'Bonchon',                            mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'อาฟเตอร์ ยู',                           name_eng: 'After You',                          mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'สเวนเซ่น',                               name_eng: "Swensen's",                          mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'ชาบูชิ',                                  name_eng: 'Shabushi',                           mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'โออิชิ แกรนด์',                         name_eng: 'Oishi Grand',                        mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'บาร์บีคิว พลาซ่า',                      name_eng: 'Bar B Q Plaza',                      mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'เดอะ พิซซ่า คอมพานี',                   name_eng: 'The Pizza Company',                  mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'พิซซ่า ฮัท',                            name_eng: 'Pizza Hut',                          mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'โดมิโน่ พิซซ่า',                        name_eng: "Domino's Pizza",                     mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'เกรย์ฮาวด์ คาเฟ่',                      name_eng: 'Greyhound Café',                     mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'เอสแอนด์พี',                            name_eng: 'S&P',                                mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'กิวคากุ',                                name_eng: 'Gyu-Kaku',                           mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'เป็ปเปอร์ ลันช์',                       name_eng: 'Pepper Lunch',                       mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'ไหตี่เหลา',                              name_eng: 'Haidilao',                           mcc_code: '5812', category: 'Restaurant' },
  { name_th: 'โทนี โรมา',                              name_eng: "Tony Roma's",                        mcc_code: '5812', category: 'Restaurant' },

  // Supermarket — 5411 (Makro จริงๆ = 5300 wholesale แต่ธนาคารไทยมักจัด 5411)
  { name_th: 'โลตัส',                                  name_eng: "Lotus's",                            mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'บิ๊กซี',                                 name_eng: 'BigC',                               mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'ท็อปส์ มาร์เก็ต',                        name_eng: 'Tops Market',                        mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'กูร์เมต์ มาร์เก็ต',                      name_eng: 'Gourmet Market',                     mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'ฟู้ดแลนด์',                               name_eng: 'Foodland',                           mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'แม็คซ์วาลู',                              name_eng: 'MaxValu',                            mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'วิลล่า มาร์เก็ต',                        name_eng: 'Villa Market',                       mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'แมคโคร',                                  name_eng: 'Makro',                              mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'ริมปิง ซูเปอร์มาร์เก็ต',                 name_eng: 'Rimping Supermarket',                mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'ท็อปส์ ฟู้ด ฮอลล์',                      name_eng: 'Tops Food Hall',                     mcc_code: '5411', category: 'Supermarket' },
  { name_th: 'เอออน ซูเปอร์สโตร์',                     name_eng: 'AEON Superstore',                    mcc_code: '5411', category: 'Supermarket' },

  // Fuel — 5541
  { name_th: 'ปตท.',                                    name_eng: 'ปตท.',                               mcc_code: '5541', category: 'Fuel' },
  { name_th: 'เชลล์',                                   name_eng: 'Shell',                              mcc_code: '5541', category: 'Fuel' },
  { name_th: 'บางจาก',                                  name_eng: 'Bangchak',                           mcc_code: '5541', category: 'Fuel' },
  { name_th: 'คาลเทกซ์',                                name_eng: 'Caltex',                             mcc_code: '5541', category: 'Fuel' },
  { name_th: 'เอสโซ่',                                  name_eng: 'Esso',                               mcc_code: '5541', category: 'Fuel' },
  { name_th: 'พีที',                                     name_eng: 'PT',                                 mcc_code: '5541', category: 'Fuel' },
  { name_th: 'ซัสโก้',                                  name_eng: 'Susco',                              mcc_code: '5541', category: 'Fuel' },
  { name_th: 'คิว8',                                    name_eng: 'Q8',                                 mcc_code: '5541', category: 'Fuel' },

  // Shopping — dept 5311, clothing 5691, home 5251, furniture 5712, sport 5941
  { name_th: 'เซ็นทรัล',                               name_eng: 'Central',                            mcc_code: '5311', category: 'Shopping' },
  { name_th: 'โรบินสัน',                                name_eng: 'Robinson',                           mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เดอะมอลล์',                               name_eng: 'The Mall',                           mcc_code: '5311', category: 'Shopping' },
  { name_th: 'สยาม พารากอน',                            name_eng: 'Siam Paragon',                       mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เอ็มบีเค เซ็นเตอร์',                      name_eng: 'MBK Center',                         mcc_code: '5311', category: 'Shopping' },
  { name_th: 'ไอคอนสยาม',                               name_eng: 'ICON SIAM',                          mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เทอร์มินอล 21',                           name_eng: 'Terminal 21',                        mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เอ็มควอเทียร์',                           name_eng: 'EmQuartier',                         mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เอ็มโพเรียม',                             name_eng: 'Emporium',                           mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เซ็นทรัลเวิลด์',                         name_eng: 'CentralWorld',                       mcc_code: '5311', category: 'Shopping' },
  { name_th: 'ซีคอน สแควร์',                            name_eng: 'Seacon Square',                      mcc_code: '5311', category: 'Shopping' },
  { name_th: 'เมกา บางนา',                               name_eng: 'Mega Bangna',                        mcc_code: '5311', category: 'Shopping' },
  { name_th: 'ซาร่า',                                   name_eng: 'ZARA',                               mcc_code: '5691', category: 'Shopping' },
  { name_th: 'เอชแอนด์เอ็ม',                            name_eng: 'H&M',                                mcc_code: '5691', category: 'Shopping' },
  { name_th: 'ยูนิโคล',                                 name_eng: 'Uniqlo',                             mcc_code: '5691', category: 'Shopping' },
  { name_th: 'มูจิ',                                    name_eng: 'Muji',                               mcc_code: '5699', category: 'Shopping' },
  { name_th: 'โฮมโปร',                                  name_eng: 'HomePro',                            mcc_code: '5251', category: 'Shopping' },
  { name_th: 'โกลบอล เฮ้าส์',                           name_eng: 'Global House',                       mcc_code: '5251', category: 'Shopping' },
  { name_th: 'ไทยวัสดุ',                                name_eng: 'Thai Watsadu',                       mcc_code: '5251', category: 'Shopping' },
  { name_th: 'ไอเกีย',                                  name_eng: 'IKEA',                               mcc_code: '5712', category: 'Shopping' },
  { name_th: 'อาดิดาส',                                 name_eng: 'Adidas',                             mcc_code: '5941', category: 'Shopping' },
  { name_th: 'ไนกี้',                                   name_eng: 'Nike',                               mcc_code: '5941', category: 'Shopping' },
  { name_th: 'ซุปเปอร์ สปอร์ต',                        name_eng: 'Super Sports',                       mcc_code: '5941', category: 'Shopping' },

  // Hospital — 8062
  { name_th: 'โรงพยาบาลบำรุงราษฎร์',                   name_eng: 'Bumrungrad',                         mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลกรุงเทพ',                        name_eng: 'Bangkok Hospital',                   mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลสมิติเวช',                       name_eng: 'Samitivej',                          mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลบีเอ็นเอช',                      name_eng: 'BNH Hospital',                       mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลเวชธานี',                        name_eng: 'Vejthani Hospital',                  mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลวิภาวดี',                        name_eng: 'Vibhavadi Hospital',                 mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลพระรามเก้า',                     name_eng: 'Praram 9 Hospital',                  mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลเปาโล',                          name_eng: 'Paolo Hospital',                     mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลพยาไท',                          name_eng: 'Phyathai Hospital',                  mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลธนบุรี',                         name_eng: 'Thonburi Hospital',                  mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลสินแพทย์',                       name_eng: 'Synphaet Hospital',                  mcc_code: '8062', category: 'Hospital' },
  { name_th: 'โรงพยาบาลเพชรเวช',                        name_eng: 'Petcharavej Hospital',               mcc_code: '8062', category: 'Hospital' },

  // Pharmacy — 5912 (Watsons บางธนาคารอาจเป็น 5977 beauty แทน)
  { name_th: 'บู๊ทส์',                                  name_eng: 'Boots',                              mcc_code: '5912', category: 'Pharmacy' },
  { name_th: 'วัตสัน',                                  name_eng: 'Watsons',                            mcc_code: '5912', category: 'Pharmacy' },
  { name_th: 'แคร์ริ่ง',                                name_eng: 'Caring',                             mcc_code: '5912', category: 'Pharmacy' },
  { name_th: 'ฟาร์มแคร์',                               name_eng: 'Pharm Care',                         mcc_code: '5912', category: 'Pharmacy' },
  { name_th: 'เมดิแคร์',                                name_eng: 'Medicare',                           mcc_code: '5912', category: 'Pharmacy' },

  // Convenience Store — 5499 (สาขาในปั้มน้ำมันอาจเป็น 5541)
  { name_th: 'เซเว่น-อีเลฟเว่น',                        name_eng: '7-Eleven',                           mcc_code: '5499', category: 'Convenience Store' },
  { name_th: 'แฟมิลี่มาร์ท',                            name_eng: 'FamilyMart',                         mcc_code: '5499', category: 'Convenience Store' },
  { name_th: 'ลอว์สัน',                                 name_eng: 'Lawson',                             mcc_code: '5499', category: 'Convenience Store' },
  { name_th: 'ซีเจ เอ็กซ์เพรส',                        name_eng: 'CJ Express',                         mcc_code: '5499', category: 'Convenience Store' },
  { name_th: 'ท็อปส์ เดลี่',                            name_eng: 'Tops Daily',                         mcc_code: '5499', category: 'Convenience Store' },
  { name_th: 'โลตัส โก เฟรช',                           name_eng: "Lotus's Go Fresh",                   mcc_code: '5499', category: 'Convenience Store' },

  // Hotel — hotel chains 7011, OTA 4722
  { name_th: 'เซ็นทารา โฮเทลส์ แอนด์ รีสอร์ท',          name_eng: 'Centara Hotels & Resorts',           mcc_code: '7011', category: 'Hotel' },
  { name_th: 'ดุสิตธานี',                                name_eng: 'Dusit Thani',                        mcc_code: '7011', category: 'Hotel' },
  { name_th: 'อมารี โฮเทลส์',                           name_eng: 'Amari Hotels',                       mcc_code: '7011', category: 'Hotel' },
  { name_th: 'ชาเทรียม โฮเทลส์',                        name_eng: 'Chatrium Hotels',                    mcc_code: '7011', category: 'Hotel' },
  { name_th: 'แมริออท',                                  name_eng: 'Marriott',                           mcc_code: '7011', category: 'Hotel' },
  { name_th: 'ฮิลตัน',                                  name_eng: 'Hilton',                             mcc_code: '7011', category: 'Hotel' },
  { name_th: 'โนโวเทล',                                 name_eng: 'Novotel',                            mcc_code: '7011', category: 'Hotel' },
  { name_th: 'พูลแมน',                                  name_eng: 'Pullman',                            mcc_code: '7011', category: 'Hotel' },
  { name_th: 'ไฮแอท',                                   name_eng: 'Hyatt',                              mcc_code: '7011', category: 'Hotel' },
  { name_th: 'โฮลิเดย์ อินน์',                          name_eng: 'Holiday Inn',                        mcc_code: '7011', category: 'Hotel' },
  { name_th: 'เลอ เมอริเดียน',                          name_eng: 'Le Meridien',                        mcc_code: '7011', category: 'Hotel' },
  { name_th: 'อโกด้า',                                  name_eng: 'Agoda',                              mcc_code: '4722', category: 'Hotel' },
  { name_th: 'บุ๊คกิ้ง ดอท คอม',                        name_eng: 'Booking.com',                        mcc_code: '4722', category: 'Hotel' },

  // Airline — 4511
  { name_th: 'การบินไทย',                               name_eng: 'Thai Airways',                       mcc_code: '4511', category: 'Airline' },
  { name_th: 'บางกอก แอร์เวย์ส',                        name_eng: 'Bangkok Airways',                    mcc_code: '4511', category: 'Airline' },
  { name_th: 'แอร์เอเชีย',                              name_eng: 'AirAsia',                            mcc_code: '4511', category: 'Airline' },
  { name_th: 'นกแอร์',                                  name_eng: 'Nok Air',                            mcc_code: '4511', category: 'Airline' },
  { name_th: 'ไทย ไลอ้อน แอร์',                        name_eng: 'Thai Lion Air',                      mcc_code: '4511', category: 'Airline' },
  { name_th: 'ไทยเวียดเจ็ทแอร์',                         name_eng: 'Thai VietJet Air',                   mcc_code: '4511', category: 'Airline' },
  { name_th: 'สิงคโปร์ แอร์ไลน์ส',                      name_eng: 'Singapore Airlines',                 mcc_code: '4511', category: 'Airline' },
  { name_th: 'คาเธย์ แปซิฟิก',                          name_eng: 'Cathay Pacific',                     mcc_code: '4511', category: 'Airline' },
  { name_th: 'อีวีเอ แอร์',                             name_eng: 'EVA Air',                            mcc_code: '4511', category: 'Airline' },
  { name_th: 'เจแปน แอร์ไลน์ส',                         name_eng: 'Japan Airlines',                     mcc_code: '4511', category: 'Airline' },

  // Transport — ride-hailing 4121, public 4111, car rental 7512
  { name_th: 'แกร็บ',                                   name_eng: 'Grab',                               mcc_code: '4121', category: 'Transport' },
  { name_th: 'โบลท์',                                   name_eng: 'Bolt',                               mcc_code: '4121', category: 'Transport' },
  { name_th: 'อินไดรฟ์',                                name_eng: 'InDrive',                            mcc_code: '4121', category: 'Transport' },
  { name_th: 'รถไฟฟ้าบีทีเอส',                          name_eng: 'BTS Skytrain',                       mcc_code: '4111', category: 'Transport' },
  { name_th: 'รถไฟฟ้า MRT',                             name_eng: 'MRT',                                mcc_code: '4111', category: 'Transport' },
  { name_th: 'แอร์พอร์ตเรลลิงก์',                       name_eng: 'Airport Rail Link',                   mcc_code: '4111', category: 'Transport' },
  { name_th: 'เอวิส',                                   name_eng: 'Avis',                               mcc_code: '7512', category: 'Transport' },
  { name_th: 'เฮิร์ทซ์',                                name_eng: 'Hertz',                              mcc_code: '7512', category: 'Transport' },
  { name_th: 'ไทย เร้นท์ อะ คาร์',                     name_eng: 'Thai Rent A Car',                    mcc_code: '7512', category: 'Transport' },

  // Entertainment — cinema 7832, streaming 4899, music 5815, theme park 7996
  { name_th: 'เมเจอร์ ซีเนเพล็กซ์',                     name_eng: 'Major Cineplex',                     mcc_code: '7832', category: 'Entertainment' },
  { name_th: 'เอสเอฟ ซีเนม่า',                          name_eng: 'SF Cinema',                          mcc_code: '7832', category: 'Entertainment' },
  { name_th: 'เน็ตฟลิกซ์',                              name_eng: 'Netflix',                            mcc_code: '4899', category: 'Entertainment' },
  { name_th: 'ดิสนีย์+ ฮอตสตาร์',                       name_eng: 'Disney+ Hotstar',                    mcc_code: '4899', category: 'Entertainment' },
  { name_th: 'ยูทูบ พรีเมียม',                          name_eng: 'YouTube Premium',                    mcc_code: '4899', category: 'Entertainment' },
  { name_th: 'เอไอเอส เพลย์',                           name_eng: 'AIS Play',                           mcc_code: '4899', category: 'Entertainment' },
  { name_th: 'ทรู ไอดี',                                name_eng: 'TRUE ID',                            mcc_code: '4899', category: 'Entertainment' },
  { name_th: 'สปอติฟาย',                                name_eng: 'Spotify',                            mcc_code: '5815', category: 'Entertainment' },
  { name_th: 'แอปเปิล มิวสิก',                          name_eng: 'Apple Music',                        mcc_code: '5815', category: 'Entertainment' },
  { name_th: 'จูกซ์',                                   name_eng: 'JOOX',                               mcc_code: '5815', category: 'Entertainment' },
  { name_th: 'ดรีมเวิลด์',                              name_eng: 'Dream World',                        mcc_code: '7996', category: 'Entertainment' },
  { name_th: 'ซาฟารี เวิลด์',                           name_eng: 'Safari World',                       mcc_code: '7996', category: 'Entertainment' },

  // Beauty & Spa — salon 7230, massage 7297, spa 7298, cosmetics 5977, fitness 7997
  { name_th: 'เล็ทส์ รีแลกซ์',                         name_eng: "Let's Relax",                        mcc_code: '7298', category: 'Beauty & Spa' },
  { name_th: 'เฮลท์ แลนด์ สปา',                        name_eng: 'Health Land Spa',                    mcc_code: '7298', category: 'Beauty & Spa' },
  { name_th: 'แพนพิวรี',                                name_eng: 'Panpuri',                            mcc_code: '7298', category: 'Beauty & Spa' },
  { name_th: 'ดิวาน่า สปา',                             name_eng: 'Divana Spa',                         mcc_code: '7298', category: 'Beauty & Spa' },
  { name_th: 'เอเชีย เฮิร์บ แอสโซซิเอชัน',               name_eng: 'Asia Herb Association',              mcc_code: '7297', category: 'Beauty & Spa' },
  { name_th: 'เซโฟรา',                                  name_eng: 'Sephora',                            mcc_code: '5977', category: 'Beauty & Spa' },
  { name_th: 'บิวตี้ บัฟเฟ่ต์',                         name_eng: 'Beauty Buffet',                      mcc_code: '5977', category: 'Beauty & Spa' },
  { name_th: 'อีฟแอนด์บอย',                             name_eng: 'Eveandboy',                          mcc_code: '5977', category: 'Beauty & Spa' },
  { name_th: 'เนเจอร์ รีพับลิก',                        name_eng: 'Nature Republic',                    mcc_code: '5977', category: 'Beauty & Spa' },
  { name_th: 'ฟิตเนส เฟิร์สต์',                        name_eng: 'Fitness First',                      mcc_code: '7997', category: 'Beauty & Spa' },
  { name_th: 'เวอร์จิน แอคทีฟ',                        name_eng: 'Virgin Active',                      mcc_code: '7997', category: 'Beauty & Spa' },
  { name_th: 'เจ็ตส์ ฟิตเนส',                          name_eng: 'Jetts Fitness',                      mcc_code: '7997', category: 'Beauty & Spa' },

  // Food Delivery — GrabFood/LINE MAN 5814, foodpanda/Robinhood 5812
  { name_th: 'แกร็บ ฟู้ด',                              name_eng: 'GrabFood',                           mcc_code: '5814', category: 'Food Delivery' },
  { name_th: 'ไลน์แมน',                                 name_eng: 'LINE MAN',                           mcc_code: '5814', category: 'Food Delivery' },
  { name_th: 'ช้อปปี้ ฟู้ด',                            name_eng: 'Shopee Food',                        mcc_code: '5814', category: 'Food Delivery' },
  { name_th: 'ฟู้ดแพนด้า',                               name_eng: 'foodpanda',                          mcc_code: '5812', category: 'Food Delivery' },
  { name_th: 'โรบินฮู้ด',                               name_eng: 'Robinhood',                          mcc_code: '5812', category: 'Food Delivery' },

  // Online — Shopee 5399, Lazada 5311 (อ้างอิง SG, ไทยอาจต่างกัน)
  { name_th: 'ช้อปปี้',                                 name_eng: 'Shopee',                             mcc_code: '5399', category: 'Online' },
  { name_th: 'ลาซาด้า',                                 name_eng: 'Lazada',                             mcc_code: '5311', category: 'Online' },
  { name_th: 'ติ๊กต็อก ช็อป',                          name_eng: 'TikTok Shop',                        mcc_code: '5399', category: 'Online' },
  { name_th: 'เซ็นทรัล ออนไลน์',                        name_eng: 'Central Online',                     mcc_code: '5311', category: 'Online' },
  { name_th: 'คลุก',                                    name_eng: 'Klook',                              mcc_code: '4722', category: 'Online' },

  // Electronics — electronics 5732, telecom 4812
  { name_th: 'เพาเวอร์บาย',                             name_eng: 'PowerBuy',                           mcc_code: '5732', category: 'Electronics' },
  { name_th: 'บานาน่า ไอที',                            name_eng: 'BaNANA IT',                          mcc_code: '5732', category: 'Electronics' },
  { name_th: 'แอ็ดไวซ์ ไอที',                           name_eng: 'Advice IT Infinite',                 mcc_code: '5732', category: 'Electronics' },
  { name_th: 'ไอสตูดิโอ',                               name_eng: 'iStudio',                            mcc_code: '5732', category: 'Electronics' },
  { name_th: 'สตูดิโอ 7',                               name_eng: 'Studio7',                            mcc_code: '5732', category: 'Electronics' },
  { name_th: 'เจมาร์ท',                                 name_eng: 'JMart',                              mcc_code: '5732', category: 'Electronics' },
  { name_th: 'เจไอบี',                                  name_eng: 'JIB',                                mcc_code: '5732', category: 'Electronics' },
  { name_th: 'ทรู ช็อป',                                name_eng: 'True Shop',                          mcc_code: '4812', category: 'Electronics' },
  { name_th: 'เอไอเอส ช็อป',                            name_eng: 'AIS Shop',                           mcc_code: '4812', category: 'Electronics' },
  { name_th: 'ดีแทค ช็อป',                              name_eng: 'dtac Shop',                          mcc_code: '4812', category: 'Electronics' },
]

async function main() {
  // ── Categories ──────────────────────────────────────────────
  const cats = await Promise.all(CATEGORIES.map(c => upsertCategory(c.name_th, c.name_eng, c.icon, c.sort_order)))
  const catMap = new Map(cats.map(c => [c.name_eng, c.id]))

  // ── Merchants ───────────────────────────────────────────────
  for (const m of MERCHANTS) {
    const category_id = catMap.get(m.category)
    if (!category_id) throw new Error(`Unknown category: ${m.category}`)
    await upsertMerchant(m.name_eng, m.name_th, m.mcc_code, category_id)
  }

  // ── Promotions (ใช้ category IDs จาก catMap) ───────────────
  const cafe       = catMap.get('Cafe')!
  const restaurant = catMap.get('Restaurant')!
  const super_     = catMap.get('Supermarket')!
  const fuel       = catMap.get('Fuel')!
  const shopping   = catMap.get('Shopping')!
  const hospital   = catMap.get('Hospital')!

  // Look up existing merchants for promo links
  const [starbucks, amazon, mk, mcdonalds, kfc, lotus, bigc, ptt, bangchak, central, samitivej, bumrungrad] =
    await Promise.all([
      prisma.merchants.findFirst({ where: { name_eng: 'Starbucks' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'Amazon Coffee' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'MK Restaurant' } }),
      prisma.merchants.findFirst({ where: { name_eng: "McDonald's" } }),
      prisma.merchants.findFirst({ where: { name_eng: 'KFC' } }),
      prisma.merchants.findFirst({ where: { name_eng: "Lotus's" } }),
      prisma.merchants.findFirst({ where: { name_eng: 'BigC' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'ปตท.' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'Bangchak' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'Central' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'Samitivej' } }),
      prisma.merchants.findFirst({ where: { name_eng: 'Bumrungrad' } }),
    ])

  const promos = await Promise.all([
    // คาเฟ่ (4)
    createPromo({ title: 'KBank คืน 15% ที่ Starbucks', bank_id: 'KBANK', category_id: cafe, promo_type: 'cashback', benefit_value: 15, benefit_unit: '%', min_spend: 100, max_cap: 100, end_date: d('2026-07-31'), condition: 'ชำระผ่านบัตรเครดิต KBank ทุกประเภท', merchant_id: starbucks?.id }),
    createPromo({ title: 'SCB ลด 30% ที่ Amazon Coffee', bank_id: 'SCB', category_id: cafe, promo_type: 'discount', benefit_value: 30, benefit_unit: '%', min_spend: 80, max_cap: 60, end_date: d('2026-08-31'), condition: 'เฉพาะวันจันทร์–ศุกร์', merchant_id: amazon?.id }),
    createPromo({ title: 'KTC คืน 10% ร้านกาแฟทุกร้าน', bank_id: 'KTC', category_id: cafe, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 200, max_cap: 80, end_date: d('2026-07-15'), condition: 'ทุกวัน ไม่จำกัดร้าน' }),
    createPromo({ title: 'UOB ลด 20% คาเฟ่ในห้าง', bank_id: 'UOB', category_id: cafe, promo_type: 'discount', benefit_value: 20, benefit_unit: '%', min_spend: 150, max_cap: 100, end_date: d('2026-07-31'), condition: 'เฉพาะร้านในห้างสรรพสินค้า' }),
    // ร้านอาหาร (4)
    createPromo({ title: 'KBank คืน 10% ที่ MK Restaurant', bank_id: 'KBANK', category_id: restaurant, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 500, max_cap: 200, end_date: d('2026-07-31'), condition: 'ทุกสาขาทั่วประเทศ', merchant_id: mk?.id }),
    createPromo({ title: "BBL ลด 30% ที่ McDonald's", bank_id: 'BBL', category_id: restaurant, promo_type: 'discount', benefit_value: 30, benefit_unit: '%', min_spend: 150, max_cap: 100, end_date: d('2026-07-20'), condition: 'เฉพาะบัตร Bangkok Bank Platinum', merchant_id: mcdonalds?.id }),
    createPromo({ title: 'KTC คืน 8% ที่ KFC', bank_id: 'KTC', category_id: restaurant, promo_type: 'cashback', benefit_value: 8, benefit_unit: '%', min_spend: 200, max_cap: 120, end_date: d('2026-07-31'), condition: 'สูงสุด 5 ครั้ง/เดือน', merchant_id: kfc?.id }),
    createPromo({ title: 'SCB คืน 5% ร้านอาหารทุกประเภท', bank_id: 'SCB', category_id: restaurant, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', min_spend: 300, max_cap: 150, end_date: d('2026-08-31'), condition: 'รวมร้าน delivery' }),
    // ซูเปอร์มาร์เก็ต (4)
    createPromo({ title: "KBank คืน 5% ที่ Lotus's", bank_id: 'KBANK', category_id: super_, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', min_spend: 500, max_cap: 200, end_date: d('2026-07-31'), condition: 'เฉพาะวันเสาร์–อาทิตย์', merchant_id: lotus?.id }),
    createPromo({ title: 'KTC คืน 8% ที่ BigC', bank_id: 'KTC', category_id: super_, promo_type: 'cashback', benefit_value: 8, benefit_unit: '%', min_spend: 300, max_cap: 150, end_date: d('2026-07-31'), condition: 'เฉพาะวันเสาร์–อาทิตย์', merchant_id: bigc?.id }),
    createPromo({ title: 'UOB คืน 3% ที่ Makro', bank_id: 'UOB', category_id: super_, promo_type: 'cashback', benefit_value: 3, benefit_unit: '%', min_spend: 1000, max_cap: 300, end_date: d('2026-08-31'), condition: 'ทุกวัน ทุกสาขา' }),
    createPromo({ title: 'BAY รับ 50 บาท ช้อปซูเปอร์', bank_id: 'BAY', category_id: super_, promo_type: 'cashback', benefit_value: 50, benefit_unit: 'บาท', min_spend: 1000, end_date: d('2026-07-31'), condition: 'สูงสุด 2 ครั้ง/เดือน' }),
    // น้ำมัน (3)
    createPromo({ title: 'KBank ลด 50 สต./ลิตร ที่ ปตท.', bank_id: 'KBANK', category_id: fuel, promo_type: 'discount', benefit_value: 0.5, benefit_unit: 'บาท/ลิตร', min_spend: 400, max_cap: 150, end_date: d('2026-07-31'), condition: 'ทุกวัน ทุกสาขา', merchant_id: ptt?.id }),
    createPromo({ title: 'SCB ลด 1 บาท/ลิตร ที่ Bangchak', bank_id: 'SCB', category_id: fuel, promo_type: 'discount', benefit_value: 1, benefit_unit: 'บาท/ลิตร', min_spend: 300, max_cap: 150, end_date: d('2026-08-31'), condition: 'เฉพาะน้ำมันแก๊สโซฮอล์', merchant_id: bangchak?.id }),
    createPromo({ title: 'BBL คืน 3% เติมน้ำมันทุกปั๊ม', bank_id: 'BBL', category_id: fuel, promo_type: 'cashback', benefit_value: 3, benefit_unit: '%', min_spend: 300, max_cap: 100, end_date: d('2026-07-31'), condition: 'ทุกปั๊มน้ำมันในไทย' }),
    // ช้อปปิ้ง (3)
    createPromo({ title: 'SCB ผ่อน 0% 10 เดือน ที่ Central', bank_id: 'SCB', category_id: shopping, promo_type: 'installment', benefit_value: 0, benefit_unit: '% ดอกเบี้ย', min_spend: 3000, end_date: d('2026-07-31'), condition: 'เฉพาะสินค้าที่ร่วมรายการ', merchant_id: central?.id }),
    createPromo({ title: 'BAY ลด 15% ที่ Robinson', bank_id: 'BAY', category_id: shopping, promo_type: 'discount', benefit_value: 15, benefit_unit: '%', min_spend: 500, max_cap: 500, end_date: d('2026-07-31'), condition: 'เฉพาะสินค้าแฟชั่นและไลฟ์สไตล์' }),
    createPromo({ title: 'AEON คืน 10% ทุกร้านในห้าง', bank_id: 'AEON', category_id: shopping, promo_type: 'cashback', benefit_value: 10, benefit_unit: '%', min_spend: 500, max_cap: 300, end_date: d('2026-08-31'), condition: 'ทุกห้างสรรพสินค้าทั่วประเทศ' }),
    // โรงพยาบาล (2)
    createPromo({ title: 'KBank คืน 5% ที่ Bumrungrad', bank_id: 'KBANK', category_id: hospital, promo_type: 'cashback', benefit_value: 5, benefit_unit: '%', max_cap: 1000, end_date: d('2026-07-31'), condition: 'ค่ารักษาพยาบาลทุกประเภท', merchant_id: bumrungrad?.id }),
    createPromo({ title: 'AEON ผ่อน 0% 24 เดือน ที่ Samitivej', bank_id: 'AEON', category_id: hospital, promo_type: 'installment', benefit_value: 0, benefit_unit: '% ดอกเบี้ย', min_spend: 5000, end_date: d('2026-12-31'), condition: 'ทุกสาขา Samitivej Group', merchant_id: samitivej?.id }),
  ])

  console.log(`✅ Seeded: ${CATEGORIES.length} categories, ${MERCHANTS.length} merchants, ${promos.length} promotions`)
}

// ── Helpers ───────────────────────────────────────────────────

const d = (s: string) => new Date(s)

async function upsertCategory(name_th: string, name_eng: string, icon: string, sort_order: number) {
  const existing = await prisma.categories.findFirst({ where: { name_eng } })
  if (existing) return existing
  return prisma.categories.create({ data: { name_th, name_eng, icon, sort_order, created_by: 'seed' } })
}

async function upsertMerchant(name_eng: string, name_th: string, mcc_code: string, category_id: string) {
  const existing = await prisma.merchants.findFirst({ where: { name_eng } })
  if (existing) {
    if (!existing.mcc_code) {
      return prisma.merchants.update({ where: { id: existing.id }, data: { mcc_code, name_th } })
    }
    return existing
  }
  return prisma.merchants.create({ data: { name_th, name_eng, mcc_code, category_id, created_by: 'seed' } })
}

async function createPromo({
  title, bank_id, category_id, promo_type, benefit_value, benefit_unit,
  min_spend, max_cap, end_date, condition, merchant_id,
}: {
  title: string; bank_id: string; category_id: string
  promo_type: string; benefit_value: number; benefit_unit: string
  min_spend?: number; max_cap?: number; end_date: Date
  condition?: string; merchant_id?: string
}) {
  const existing = await prisma.promotions.findFirst({ where: { title } })
  if (existing) return existing

  const promo = await prisma.promotions.create({
    data: {
      title, bank_id, category_id, promo_type, benefit_value, benefit_unit,
      min_spend: min_spend ?? null,
      max_cap: max_cap ?? null,
      start_date: new Date('2026-07-01'),
      end_date, condition: condition ?? null,
      status: 'active',
      created_by: 'seed',
    },
  })

  if (merchant_id) {
    const exists = await prisma.promotion_merchants.findFirst({
      where: { promotion_id: promo.id, merchant_id },
    })
    if (!exists) {
      await prisma.promotion_merchants.create({
        data: { promotion_id: promo.id, merchant_id },
      })
    }
  }

  return promo
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
