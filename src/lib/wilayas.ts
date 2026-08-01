// src/lib/wilayas.ts
// بيانات الولايات الـ 69 مع بلدياتها وأسعار التوصيل
// Anderson E-commerce Logistics
// المصدر: القانون رقم 26-06 بتاريخ 4 أفريل 2026 — 69 ولاية و1541 بلدية
// الولايات 59-69 الجديدة: نفس سعر توصيل الولاية الأم السابقة

export interface Wilaya {
  code: number;
  name: string;
  name_ar: string;
  homePrice: number;
  deskPrice: number;
  communes: string[];
}

export const WILAYAS: Wilaya[] = [
  {
    code: 1, name: "Adrar", name_ar: "أدرار",
    homePrice: 1300, deskPrice: 800,
    communes: [
      "Adrar","Akabli","Aougrout","Aoulef","Bouda","Charouine","Fenoughil",
      "In Zghmir","Ksar Kaddour","Metarfa","Ouled Ahmed Tammi","Ouled Aissa",
      "Reggane","Sali","Sebaa","Talmine","Tamantit","Tamast","Timokten",
      "Tinerkouk","Tit","Tsabit","Zaouiet Kounta"
    ]
  },
  {
    code: 2, name: "Chlef", name_ar: "الشلف",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Abou El Hassen","Ain Merane","Benairia","Beni Bouattab","Beni Haoua",
      "Beni Rachid","Boukadir","Bouzeghaia","Breira","Chettia","Chlef","Dahra",
      "El Hadjadj","El Karimia","El Marsa","Harenfa","Harchoun","Labiodh Medjadja",
      "Moussadek","Oued Ghoussine","Oued Sly","Ouled Abbes",
      "Ouled Ben Abdelkader","Ouled Fares","Oum Drou","Sendjas",
      "Sidi Abderrahmane","Sidi Akkacha","Sobha","Tadjena","Talassa",
      "Taougrite","Tenes","Wadi Al Fiddha","Zeboudja"
    ]
  },
  {
    code: 3, name: "Laghouat", name_ar: "الأغواط",
    homePrice: 900, deskPrice: 450,
    communes: [
      "Aflou","Ain Madhi","Ain Sidi Ali","Beidha","Bennasser Benchohra","Brida",
      "El Assafia","El Ghicha","El Houita","Gueltat Sidi Saad","Hadj Mechri",
      "Hassi Delaa","Hassi R'Mel","Kheneg","Ksar El Hiranet","Laghouat",
      "Oued Morra","Oued M'zi","Sebgag","Sidi Bouzid","Sidi Makhlouf",
      "Tadjemout","Tadjrouna","Taouila"
    ]
  },
  {
    code: 4, name: "Oum El Bouaghi", name_ar: "أم البواقي",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Babouche","Ain Beïda","Ain Diss","Ain Fakroun","Ain Kercha","Ain M'lila",
      "Aïn Zitoun","Behir Chergui","Berriche","Dhalaa","F'Kirina","Ksar Sbahi",
      "Meskiana","Oum El Bouaghi","Sigus","Souk Naamane"
    ]
  },
  {
    code: 5, name: "Batna", name_ar: "باتنة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Aïn Djasser","Aïn Touta","Arris","Batna","Bouzina","Chemora","Djezzar",
      "El Madher","Ichemoul","Merouana","Menaa","N'Gaous","Ouled Si Slimane",
      "Ras El Aioun","Seggana","Seriana","Tazoult","Teniet El Abed","Timgad",
      "T'Kout","Theniet El Abed"
    ]
  },
  {
    code: 6, name: "Béjaïa", name_ar: "بجاية",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Adekar","Akfadou","Amizour","Aokas","Bejaia","Beni Ksila","Beni Maouche",
      "Chemini","Darguina","Draâ El Gaïd","El Kseur","Feraoun","Ighil Ali",
      "Ighram","Kherrata","Leflaye","Melbou","Ouzellaguen","Seddouk","Sidi Aïch",
      "Souk El Tenine","Taourirt Ighil","Tifra","Tichy","Timezrit","Tinebdar",
      "Tizi N'Berber"
    ]
  },
  {
    code: 7, name: "Biskra", name_ar: "بسكرة",
    homePrice: 900, deskPrice: 450,
    communes: [
      "Ain Naga","Biskra","Branis","Chetma","Djemorah","El Feidh","El Hadjeb",
      "El Kantara","El Outaya","Foughala","Lioua","M'Chouneche","Meziraa",
      "Mkhachkha","Oued Djellal","Ourlal","Ras El Miad","Sidi Okba","Tolga",
      "Zeribet El Oued"
    ]
  },
  {
    code: 8, name: "Béchar", name_ar: "بشار",
    homePrice: 1000, deskPrice: 600,
    communes: [
      "Abadla","Bechar","Beni Ounif","Boukais","El Ouata","Erg Ferradj",
      "Igli","Kenadsa","Lahmar","Meridja","Mogheul","Ouled Khoudir",
      "Tabalbala","Taghit","Tamtert","Timoudi"
    ]
  },
  {
    code: 9, name: "Blida", name_ar: "البليدة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Romana","Ben Khellil","Birtouta","Blida","Bougara","Bouinan",
      "Boufarik","Bou Arfa","Chebli","Chiffa","Chrea","Hammam Melouane",
      "Larbaa","Meftah","Mouzaia","Oued Djer","Ouled Slama","Ouled Yaïch",
      "Soumaa"
    ]
  },
  {
    code: 10, name: "Bouira", name_ar: "البويرة",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ahl El Ksar","Ain Bessem","Ain El Hadjar","Ain Lahdjar","Ain Turk",
      "Bechloul","Beni Mansour","Bordj Okhriss","Bouira","Dechmia","Dirah",
      "El Adjiba","El Asnam","El Esnam","El Hachimia","El Khabouzia",
      "Haizer","Lakhdaria","M'Chedallah","Maâla","Ouled Rached","Raouraoua",
      "Ridane","Saharidj","Souk El Khemis","Sour El Ghozlane","Taguedit",
      "Taghzout","Zbarbar"
    ]
  },
  {
    code: 11, name: "Tamanrasset", name_ar: "تمنراست",
    homePrice: 1500, deskPrice: 750,
    communes: [
      "Abalessa","Ain Salah","Foggaret Ezzaouia","Ideles","In Ghar",
      "In Guezzam","In Salah","Tamanrasset","Tazrouk","Tim Iaouine"
    ]
  },
  {
    code: 12, name: "Tébessa", name_ar: "تبسة",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Ain Zerga","Bekkaria","Bir El Ater","Bir Mokadem","Boulhaf Dyr",
      "Cheria","El Aouinet","El Houidjbet","El Ma Labiodh","El Ogla",
      "El Ouenza","Ferkane","Hammamet","Morsott","Negrine","Oum Ali",
      "Safsaf El Oussera","Stah Guentis","Tebessa","Thlidjene"
    ]
  },
  {
    code: 13, name: "Tlemcen", name_ar: "تلمسان",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain Fezza","Ain Ghoraba","Ain Kebira","Ain Nehala","Ain Tallout","Ain Youcef",
      "Bab El Assa","Beni Bahdel","Beni Boussaid","Beni Mester","Beni Ouarsous",
      "Beni Snous","Bouhlou","Chetouane","Dar Yaghmoracen","El Aricha","El Fehoul",
      "El Gor","Fellaoucene","Ghazaouet","Hammam Boughrara","Hennaya","Honaine",
      "Maghnia","Mansourah","Marsa Ben M'Hidi","Nedroma","Ouled Mimoun",
      "Ouled Riyah","Remchi","Sabra","Sebdou","Sidi Abdelli","Sidi Djillali",
      "Souahlia","Souani","Tlemcen","Zenata"
    ]
  },
  {
    code: 14, name: "Tiaret", name_ar: "تيارت",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain Bouchekif","Ain Deheb","Ain El Hadid","Ain Kermes","Ain Thrid",
      "Bougara","Chehaida","Dahmouni","Djillali Ben Amar","Faidja","Frenda",
      "Guertoufa","Hamadia","Ksar Chellala","Mahdia","Mechraa Safa","Medrissa",
      "Meghila","Mellakou","Nadorah","Oued Lilli","Rahouia","Rechaiga",
      "Sebaïne","Serghine","Si Abdelghani","Sidi Abderrahmane","Sidi Ali Mellal",
      "Sidi Bakhti","Tagdemt","Takhemaret","Tiaret","Tousnina","Zmalet El Emir Abdelkader"
    ]
  },
  {
    code: 15, name: "Tizi Ouzou", name_ar: "تيزي وزو",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Abi Youcef","Ait Aggouacha","Ait Aissa Mimoun","Ait Bouaddou","Ait Boumahdi",
      "Ait Chafaa","Ait Khellili","Ait Mahmoud","Ait Toudert","Ait Yahia",
      "Ait Yahia Moussa","Ait Zikki","Akerrou","Aïn El Hammam","Aïn Zaouia",
      "Assi Youcef","Azzefoun","Beni Aïssi","Beni Douala","Beni Yenni","Beni Zmenzer",
      "Boghni","Boudjima","Bouzeguene","Draa Ben Khedda","Draa El Mizan","Freha",
      "Frikat","Iferhounen","Ifigha","Iflissen","Ighzer Amokrane","Illilten",
      "Imsouhane","Irdjen","Larbaâ Nath Irathen","Maatkas","Makouda","Mechtras",
      "Mekla","Mizrana","Ouadhia","Ouaguenoun","Sidi Naamane","Souk El Tnine",
      "Tadmaït","Tigzirt","Timizart","Tirmitine","Tizi Gheniff","Tizi Ouzou",
      "Tizi Rached","Yakouren","Zekri"
    ]
  },
  {
    code: 16, name: "Alger", name_ar: "الجزائر",
    homePrice: 600, deskPrice: 450,
    communes: [
      "Ain Benian","Ain Taya","Alger Centre","Bab El Oued","Bab Ezzouar",
      "Baraki","Belouizdad","Ben Aknoun","Beni Messous","Bir Mourad Raïs",
      "Bir Touta","Birkhadem","Bouzareah","Cheraga","Dar El Beïda","Dely Ibrahim",
      "Djasr Kasentina","Douera","Draria","El Achour","El Biar","El Harrach",
      "El Madania","El Marsa","El Mouradia","Eucalyptus","Gué de Constantine",
      "Hussein Dey","Hydra","Khraïcia","Kouba","Les Eucalyptus","Mahelma",
      "Mohamed Belouizdad","Mohammadia","Oued Koriche","Oued Smar","Ouled Chebel",
      "Rahmania","Reghaia","Rouïba","Saoula","Sidi Abdallah","Sidi M'Hamed",
      "Sidi Moussa","Souidania","Staoueli","Tessala El Merdja","Testitane",
      "Ain Ben Abid","Zeralda"
    ]
  },
  {
    code: 17, name: "Djelfa", name_ar: "الجلفة",
    homePrice: 900, deskPrice: 500,
    communes: [
      "Ain Chouhada","Ain El Ibel","Ain Fekka","Ain Maabed","Ain Oussera",
      "Ain Wissara","Amourah","Benhar","Birine","Bouira Lahdab","Charef",
      "Dar Chioukh","Deldoul","Djelfa","El Idrissia","El Khemis","Faidh El Botma",
      "Ghilia","Guernini","Had Es Sahary","Hassi Bahbah","Hassi El Euch",
      "Hassi Fedoul","Messad","Moudjebara","Oum Laadham","Selmana","Sed Rahal",
      "Sidi Baizid","Sidi Ladjel","Zaafrane","Zaccar"
    ]
  },
  {
    code: 18, name: "Jijel", name_ar: "جيجل",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Makhlouf","Bordj T'Har","Boudriaa Ben Yadjis","Bouraoui Belhadef",
      "Chahna","Chekfa","Djimla","El Ancer","El Aouana","El Milia","Emir Abdelkader",
      "Erraguene","Ghebala","Jijel","Kaous","Khier Oued Adjoul","Ouled Rabah",
      "Selma Benziada","Settara","Sidi Abdelaziz","Sidi Maarouf","Taher",
      "Texenna","Ziama Mansouriah"
    ]
  },
  {
    code: 19, name: "Sétif", name_ar: "سطيف",
    homePrice: 450, deskPrice: 300,
    communes: [
      "Ain Abessa","Ain Arnat","Ain Azal","Ain El Kebira","Ain Lahdjar",
      "Ain Legradj","Ain Oulmane","Ain Roua","Ain Sebt","Ait Nawal M'zada",
      "Ait Tizi","Amoucha","Babor","Bazer Sakra","Beidha Bordj","Belaa",
      "Beni Chebana","Beni Fouda","Beni Mouhli","Beni Ouartilane","Beni Hocine",
      "Beni Aziz","Bir El Arch","Bir Haddada","Bouandas","Bougaa","Bousselam",
      "Boutaleb","Dehamcha","Djemila","Draa Kebila","El Eulma","El Ouricia",
      "El Oueldja","Guellal","Guelta Zerka","Guenzet","Guidjel","Hammam Sokhna",
      "Hamma","Hammam Guergour","Harbil","Ksar El Abtal","Maaouia","Maoklane",
      "Mezloug","Oued El Bared","Ouled Addouane","Ouled Sabor","Ouled Si Ahmed",
      "Ouled Tebben","Rosfa","Salah Bey","Serdj el Ghoul","Setif","Tachouda",
      "Tala Ifacene","Taya","Tella","Tizi N'Bechar"
    ]
  },
  {
    code: 20, name: "Saïda", name_ar: "سعيدة",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Ain El Hadjar","Ain Skhouna","Ain Soltane","Doui Thabet","Hassasna",
      "Hounet","Mamora","Moulay Larbi","Ouled Brahim","Ouled Khaled",
      "Saida","Sidi Ahmed","Sidi Amar","Sidi Boubekeur","Tircine","Youb"
    ]
  },
  {
    code: 21, name: "Skikda", name_ar: "سكيكدة",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Bouziane","Ain Charchar","Ain Kechra","Ain Zouit","Azzaba",
      "Bekkouche Lakhdar","Ben Azouz","Beni Bechir","Beni Oulbane","Beni Zid",
      "Bin El Ouiden","Bouchetata","Cheraia","Collo","Djendel Saadi Mohamed",
      "El Ghedir","El Hadaik","El Harrouch","El Marsa","Emdjez Edchich",
      "Es Sebt","Filfila","Hammadi Krouma","Kanoua","Kerkera","Kheneg Mayoum",
      "Ouldja Boulbalout","Oum Toub","Ramdane Djamel","Salah Bouchaour",
      "Sidi Mezghiche","Skikda","Tamalous","Zitouna"
    ]
  },
  {
    code: 22, name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Amarnas","Ain Adden","Ain El Berd","Ain Kada","Ain Thrid","Ain Tindamine",
      "Belarbi","Ben Badis","Bir El Hammam","Bou Khanifis","Chetouane","Dhaya",
      "El Hacaiba","Hassi Zahana","Lamtar","Marhoum","Merine","Mezaourou",
      "Mostefa Benbrahim","Moulay Slissen","Oued Sebbah","Oued Taourira",
      "Ras El Ma","Redjem Demouche","Sehala Thaoura","Sidi Ali Benyoub",
      "Sidi Ali Boussidi","Sidi Bel Abbes","Sidi Brahim","Sidi Chaib",
      "Sidi Khaled","Sidi Lahcene","Sidi Yacoub","Tabia","Teghalimet",
      "Tellagh","Tenira","Tessala","Zerouala"
    ]
  },
  {
    code: 23, name: "Annaba", name_ar: "عنابة",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Berda","Annaba","Berrahal","Chetaïbi","El Bouni","El Eulma",
      "El Hadjar","Oued El Aneb","Seraïdi","Sidi Amar"
    ]
  },
  {
    code: 24, name: "Guelma", name_ar: "قالمة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Ben Beida","Ain Makhlouf","Ain Reggada","Ain Sandel","Belkheir",
      "Ben Djarah","Bouchegouf","Bouati Mahmoud","Dahouara","Djebala",
      "El Fedjoudj","Guelaat Bou Sbaa","Guelma","Hammam Debagh","Hammam N'Bails",
      "Houari Boumediene","Khezaras","Medjez Amar","Medjez Sfa","Nechmaya",
      "Oued Fragha","Oued Zenati","Ras El Agba","Roknia","Sellaoua Announa",
      "Tamlouka"
    ]
  },
  {
    code: 25, name: "Constantine", name_ar: "قسنطينة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Abid","Beni Hamidane","Constantine","El Khroub","Hamma Bouziane",
      "Ibn Badis","Ibn Ziad","Messaoud Boudjeriou","Ouled Rahmoune","Zighoud Youcef"
    ]
  },
  {
    code: 26, name: "Médéa", name_ar: "المدية",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Boucif","Ain Ouksir","Berrouaghia","Boghar","Bou Aïche","Boughezoul",
      "Chahbounia","Chelalet El Adhaoura","Cheniguel","Derrag","El Azizia",
      "El Ouinet","Kefane","Ksar Boukhari","Medea","Meftaha","Mesdour",
      "Oum El Djallil","Ouled Antar","Ouled Hellal","Ouled Maaref",
      "Ouled Deide","Ouzera","Rebaia","Saneg","Si Mahdjoub","Sidi Damed",
      "Sidi Naamane","Sidi Zahar","Tablat","Tafraout","Tizi Mahdi"
    ]
  },
  {
    code: 27, name: "Mostaganem", name_ar: "مستغانم",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Achaacha","Ain Boudinar","Ain Nouissy","Ain Sidi Cherif","Ain Tedeles",
      "Bouguirat","Fornaka","Hadjadj","Hassi Mameche","Kheir Eddine","Kheireddine",
      "Mansourah","Mesra","Mezghrane","Mostaganem","Nekmaria","Oued El Kheir",
      "Safsaf","Sayada","Sidi Ali","Sidi Ali Chiker","Sidi Bellater","Sidi Lakhdar",
      "Sirat","Souaflia","Stidia","Tazgait","Touahria"
    ]
  },
  {
    code: 28, name: "M'Sila", name_ar: "المسيلة",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Ain El Meleh","Ain Errich","Ain Fares","Ain Rich","Ben Srour","Benzouh",
      "Bir Foda","Bir Hadjadj","Bou Saada","Djebel Messaad","El Hamel","El Houamed",
      "Hammam Dalaa","Khoubana","Magra","M'Cif","Mcif","Medjedel","Menaa",
      "Metarfa","Mohamed Boudiaf","M'Sila","Ouled Addi Guebala","Ouled Atia",
      "Ouled Cherif","Ouled Derradj","Ouled Madhi","Ouled Mansour","Ouled Sidi Brahim",
      "Ouled Slimane","Oulteme","Sidi Aïssa","Sidi M'Hamed","Sidi Ameur",
      "Sidi Hadjeres","Slim","Tamsa","Zarzour"
    ]
  },
  {
    code: 29, name: "Mascara", name_ar: "معسكر",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain Fares","Ain Fekan","Ain Frass","Ain Frose","Bou Hanifia","Elloune",
      "El Ghomri","El Keurt","Ferraguig","Gharrous","Ghriss","Guerdjoum",
      "Hachem","Khalouia","Louza","Mamounia","Mascara","Matemore","Mocta Douz",
      "Nesmoth","Oggaz","Oued El Abtal","Oued Taria","Ras El Aïn Amirouche",
      "Sedjerara","Sidi Abdelmoumen","Sidi Abderrahmane","Sidi Kada","Sidi Boussaid",
      "Tighennif","Tizi","Zahana"
    ]
  },
  {
    code: 30, name: "Ouargla", name_ar: "ورقلة",
    homePrice: 900, deskPrice: 450,
    communes: [
      "El Alia","El Borma","Hassi Messaoud","In Amenas","Megarine","N'Goussa",
      "Nezla","Ouargla","Rouissat","Sidi Khouiled","Tamacine","Tebesbest",
      "Touggourt","Taibet","Zaouia El Abidia"
    ]
  },
  {
    code: 31, name: "Oran", name_ar: "وهران",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain El Turk","Ain El Bya","Arzew","Ben Freha","Bethioua","Bir El Djir",
      "Bousfer","Boutlelis","El Ankad","El Braya","El Kerma","Es Senia",
      "Gdyel","Hassi Bounif","Hassi Mefsoukh","Marsat El Hadjadj","Mers El Kebir",
      "Misserghin","Oran","Oued Tlélat","Reghaia","Sidi Ben Yebka","Sidi Chami",
      "Tafraoui","Tin El Aïne"
    ]
  },
  {
    code: 32, name: "El Bayadh", name_ar: "البيض",
    homePrice: 1000, deskPrice: 500,
    communes: [
      "Ain El Orak","Arbaouat","Bougtoub","Boualem","Bougtob","Boussemghoun",
      "Brezina","Cheguig","Chellala","El Abiodh Sidi Cheikh","El Bayadh",
      "El Bnoud","El Kheiter","El Mahara","Ghassoul","Kef Lahmar","Kraakda",
      "Mehara","Rogassa","Sidi Ameur","Stitten","Tousmouline"
    ]
  },
  {
    code: 33, name: "Illizi", name_ar: "إليزي",
    homePrice: 1700, deskPrice: 800,
    communes: [
      "Bordj El Houasse","Djanet","Illizi","In Amenas"
    ]
  },
  {
    code: 34, name: "Bordj Bou Arréridj", name_ar: "برج بوعريريج",
    homePrice: 550, deskPrice: 450,
    communes: [
      "Aïn Taghrout","Aïn Tesra","Bert","Bir Kasdali","Bordj Bou Arréridj",
      "Bordj Ghdir","Bordj Zemoura","Colla","Djaafra","El Achir","El Ach",
      "El Anseur","El Main","El M'Hir","Ghilassa","Hasnaoua","Khelil",
      "Ksour","Mansourah","Medjana","Ouled Braham","Ouled Dahmane","Ouled Ibrahim",
      "Ouled Sidi Brahim","Ould Zouai","Rabta","Ras El Oued","Sidi Embarek",
      "Taglait","Takouk","Teniet En Nasr","Tixter"
    ]
  },
  {
    code: 35, name: "Boumerdès", name_ar: "بومرداس",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Afir","Ain Taya","Baghlia","Beni Amrane","Boudouaou","Boudouaou El Bahri",
      "Boughezoul","Boumerdes","Bouzegza Keddara","Chabet El Ameur","Dellys",
      "Djinet","El Kharrouba","Hammedi","Issers","Keddara","Khemis El Khechna",
      "Laghata","Leghata","Larbatache","Naciria","Ouled Aïssa","Ouled Heddadj",
      "Ouled Moussa","Si Mustapha","Souk El Had","Taourga","Timezrit","Thenia","Zemmouri"
    ]
  },
  {
    code: 36, name: "El Tarf", name_ar: "الطارف",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Aïn El Assel","Ben Mhidi","Besbes","Bougous","Bouhadjar","Bouteldja",
      "Chebaita Mokhtar","Chefia","Chihani","Dréan","El Aioun","El Kala",
      "El Tarf","Hammam Beni Salah","Lac des Oiseaux","Raml Souk","Souarekh",
      "Zerizer","Zitouna"
    ]
  },
  {
    code: 37, name: "Tindouf", name_ar: "تندوف",
    homePrice: 1600, deskPrice: 800,
    communes: ["Oum El Assel","Tindouf"]
  },
  {
    code: 38, name: "Tissemsilt", name_ar: "تيسمسيلت",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Ain Aziz","Ain Bouchekif","Ammari","Beni Chaib","Beni Lahcene","Bordj Bou Naama",
      "Bordj El Emir Abdelkader","Boukadir","Boucaid","Khemisti","Lazharia",
      "Lardjem","Layoune","Maadna","Melaab","Ouled Bessem","Sidi Abed",
      "Sidi Boutouchent","Sidi Lantri","Sidi Slimane","Theniet El Had","Tissemsilt",
      "Youssoufia"
    ]
  },
  {
    code: 39, name: "El Oued", name_ar: "الوادي",
    homePrice: 900, deskPrice: 450,
    communes: [
      "Bayadha","Benziane","Debila","Douar El Ma","El Mghair","El Oued","Hamraia",
      "Kouinine","Magrane","Mih Ouansa","Nakhla","Oued El Alenda","Ourmas",
      "Regane","Robbah","Sidi Aoun","Sidi Khellil","Still","Taghzout",
      "Taleb Larbi","Tendla","Trifaoui","Yebbi"
    ]
  },
  {
    code: 40, name: "Khenchela", name_ar: "خنشلة",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Touila","Babar","Bouhmama","Chechar","El Hamma","El Mahmal","El Oueldja",
      "Ensigha","Kais","Khenchela","Khirane","M'Sara","Mtoussa","Ouled Rechache",
      "Remila","Tamza","Yabous"
    ]
  },
  {
    code: 41, name: "Souk Ahras", name_ar: "سوق أهراس",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Zana","Bir Bouhouche","Drea","Hannène","Heddada","Khedara","Khemissa",
      "Lehdada","M'Daourouch","Mechroha","Merahna","Ouled Driss","Ouled Moumen",
      "Ragouba","Safel El Ouidane","Sedrata","Sidi Fredj","Souk Ahras","Taoura",
      "Terraguelt","Tiffech","Zarouria"
    ]
  },
  {
    code: 42, name: "Tipaza", name_ar: "تيبازة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Aghbal","Ahmar El Ain","Ain Tagourait","Attatba","Bou Ismaïl","Bouharoun",
      "Cherchell","Damous","El Nador","Fouka","Gouraya","Hadjout","Khemisti",
      "Kolea","Larhat","Marengo","Menaceur","Meurad","Messelmoun","Nador",
      "Oued Aliche","Sidi Amar","Sidi Ghiles","Sidi Rached","Sidi Semiane",
      "Tipaza","Zeralda"
    ]
  },
  {
    code: 43, name: "Mila", name_ar: "ميلة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Ain Beida Harriche","Ain Mellouk","Ain Tine","Amira Arras","Benyahia Abderrahmane",
      "Bouhatem","Chelghoum Laïd","Chigara","Derradji Bousselah","El Mechira",
      "Ferdjioua","Grarem Gouga","Hamala","Mila","Minar Zarza","Oued Athmania",
      "Oued Endja","Rouached","Sidi Khelifa","Sidi Merouane","Tadjenanet",
      "Teleghma","Terrai Bainen","Tessala Lemtaï","Tassadane Haddada"
    ]
  },
  {
    code: 44, name: "Aïn Defla", name_ar: "عين الدفلة",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ain Defla","Ain Lechiakh","Ain Torki","Bathia","Ben Allal","Bordj Emir Khaled",
      "Boumedfaa","Djendel","El Abadia","El Amra","El Attaf","Hammam Righa",
      "Djelida","Khemis","Melouka","Miliana","Oued Chorfa","Ouled Ayyad",
      "Rouina","Tarik Ibn Ziyad","Tiberkanine"
    ]
  },
  {
    code: 45, name: "Naâma", name_ar: "النعامة",
    homePrice: 1000, deskPrice: 500,
    communes: [
      "Ain Sefra","Assela","Djeniene Bourezg","Kasdir","Makman Ben Ammar",
      "Mecheria","Moghrar","Naama","Sfisifa","Tiout"
    ]
  },
  {
    code: 46, name: "Aïn Témouchent", name_ar: "عين تيموشنت",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain El Arbaa","Ain Kihal","Ain Lekhal","Ain Temouchent","Al Malih",
      "Aoubellil","Beni Saf","Chaabat El Leham","El Amria","El Emir Abdelkader",
      "El Messaid","Hammam Bou Hadjar","Hassi El Ghella","Mezereg","Oulhaça El Gheraba",
      "Oued Berkeche","Oued Sabah","Sidi Ben Adda","Sidi Boumediene","Sidi Safi",
      "Souk Tlata","Tamzoura","Terga"
    ]
  },
  {
    code: 47, name: "Ghardaïa", name_ar: "غرداية",
    homePrice: 900, deskPrice: 600,
    communes: [
      "Berriane","Bounoura","Dhayet Bendhahoua","El Atteuf","El Guerrara","El Menia",
      "Ghardaia","Hassi El Fehal","Hassi Gara","Mansoura","Metlili","Sebseb","Zelfana"
    ]
  },
  {
    code: 48, name: "Relizane", name_ar: "غليزان",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ain Tarik","Ammi Moussa","Aït Mendes","Djdiouia","El Hamadna","El Matmar",
      "Had Echkalla","Khemisti","Lahlef","Mazouna","Mendes","Oued Rhiou",
      "Ramka","Relizane","Sidi M'Hamed Ben Ali","Yellel","Zemmora"
    ]
  },
  {
    code: 49, name: "Timimoun", name_ar: "تيميمون",
    homePrice: 1300, deskPrice: 750,
    communes: [
      "Aougrout","Charouine","Deldoul","In Zghmir","Ksar Kaddour","Metarfa",
      "Ouled Aissa","Ouled Said","Talmine","Timimoune","Tinerkouk","Tsabit"
    ]
  },
  {
    code: 50, name: "Bordj Badji Mokhtar", name_ar: "برج باجي مختار",
    homePrice: 1500, deskPrice: 750,
    communes: ["Bordj Badji Mokhtar","Timiaouine"]
  },
  {
    code: 51, name: "Ouled Djellal", name_ar: "أولاد جلال",
    homePrice: 900, deskPrice: 500,
    communes: [
      "Doucen","El Hadjeb","Ouled Djellal","Ras El Miad","Sidi Khaled"
    ]
  },
  {
    code: 52, name: "Beni Abbes", name_ar: "بني عباس",
    homePrice: 1050, deskPrice: 550,
    communes: [
      "Beni Abbes","El Ouata","Igli","Ksabi","Ouled Khoudir","Tabelbala","Timoudi"
    ]
  },
  {
    code: 53, name: "In Salah", name_ar: "عين صالح",
    homePrice: 1400, deskPrice: 750,
    communes: ["Foggaret Ezzaouia","In Ghar","In Salah"]
  },
  {
    code: 54, name: "In Guezzam", name_ar: "عين قزام",
    homePrice: 1700, deskPrice: 750,
    communes: ["In Guezzam","Tin Zaouatine"]
  },
  {
    code: 55, name: "Touggourt", name_ar: "تقرت",
    homePrice: 1000, deskPrice: 550,
    communes: [
      "Blidet Amor","El Hadjira","M'Naguer","Megarine","Nezla","Taibet",
      "Tamacine","Tebesbest","Touggourt","Zaouia El Abidia"
    ]
  },
  {
    code: 56, name: "Djanet", name_ar: "جانت",
    homePrice: 1600, deskPrice: 800,
    communes: ["Djanet","Illizi"]
  },
  {
    code: 57, name: "El M'Ghair", name_ar: "المغير",
    homePrice: 900, deskPrice: 500,
    communes: [
      "Djamaa","El M'Ghair","Oued Allenda","Sidi Amrane","Still","Tenedla"
    ]
  },
  {
    code: 58, name: "El Meniaa", name_ar: "المنيعة",
    homePrice: 1000, deskPrice: 500,
    communes: [
      "El Meniaa","Hassi El Fehal","Hassi Gara","Mansourah","Sebseb"
    ]
  },

  // ============================================================
  // الولايات الجديدة (59-69) — القانون 26-06 بتاريخ 4 أفريل 2026
  // ============================================================

  {
    code: 59, name: "Aflou", name_ar: "أفلو",
    homePrice: 900, deskPrice: 450,
    communes: [
      "Aflou","Sebgag","Sidi Bouzid",
      "Brida","Hadj Mechri","Taouiala",
      "Gueltat Sidi Saad","Ain Sidi Ali","El Beïdha",
      "Oued Morra","Oued M'zi",
      "El Ghicha"
    ]
  },
  {
    code: 60, name: "Barika", name_ar: "بريكة",
    homePrice: 700, deskPrice: 450,
    communes: [
      "Barika","Bitam","Amdoukal",
      "Seggana","Tilatou",
      "Djezzar","Abdelkader Azil","Ouled Ammar"
    ]
  },
  {
    code: 61, name: "El Kantara", name_ar: "القنطرة",
    homePrice: 900, deskPrice: 450,
    communes: [
      "El Kantara","Ain Zaatout",
      "Djemourah","Branis",
      "El Outaya"
    ]
  },
  {
    code: 62, name: "Bir El Ater", name_ar: "بئر العاتر",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Bir El Ater","El Ogla El Melha",
      "Negrine","Ferkane"
    ]
  },
  {
    code: 63, name: "El Aricha", name_ar: "العريشة",
    homePrice: 850, deskPrice: 450,
    communes: [
      "El Aricha","El Gor",
      "Sidi Djillali","El Bouihi"
    ]
  },
  {
    code: 64, name: "Ksar Chellala", name_ar: "قصر الشلالة",
    homePrice: 850, deskPrice: 450,
    communes: [
      "Ksar Chellala","Zmalet El Emir Abdelkader","Serghine",
      "Hamadia","Rechaiga","Bougara"
    ]
  },
  {
    code: 65, name: "Aïn Oussera", name_ar: "عين وسارة",
    homePrice: 900, deskPrice: 500,
    communes: [
      "Aïn Oussera","Guernini",
      "Birine","Benhar",
      "Sidi Ladjel","El Khemis","Hassi Fedoul",
      "Had Sahary","Bouira Lahdab","Ain Fekka"
    ]
  },
  {
    code: 66, name: "Messaad", name_ar: "مسعد",
    homePrice: 900, deskPrice: 500,
    communes: [
      "Messaad","Sed Rahal","Guettara","Selmana","Deldoul",
      "Faïdh El Botma","Oum Laadham","Amourah"
    ]
  },
  {
    code: 67, name: "Ksar El Boukhari", name_ar: "قصر البخاري",
    homePrice: 750, deskPrice: 450,
    communes: [
      "Ksar Boukhari","Meftaha","Saneg",
      "Aïn Boucif","Ouled Maaref","Kef Lakhdar","Sidi Damed","El Ouinet",
      "Chelalet El Adhaoura","Tafraout","Cheniguel","Ain Ouksir",
      "El Azizia","Derrag","Oum El Djallil",
      "Chahbounia","Bou Aïche","Boughezoul",
      "Ouled Antar","Ouled Hellal","Boghar"
    ]
  },
  {
    code: 68, name: "Bou Saâda", name_ar: "بوسعادة",
    homePrice: 800, deskPrice: 450,
    communes: [
      "Bou Saâda","El Hamel","Oulteme",
      "Khoubana","M'Cif","El Houamed",
      "Ouled Sidi Brahim","Benzouh",
      "Sidi Ameur","Tamsa",
      "Ben Srour","Ouled Slimane","Zarzour","Mohamed Boudiaf",
      "Ain El Meleh","Bir Foda","Ain Fares","Sidi M'Hamed","Ain Errich",
      "Medjedel","Menaa",
      "Djebel Messaad","Slim"
    ]
  },
  {
    code: 69, name: "El Abiodh Sidi Cheikh", name_ar: "الأبيض سيدي الشيخ",
    homePrice: 1000, deskPrice: 500,
    communes: [
      "El Abiodh Sidi Cheikh","Ain El Orak","Arbaouat","El Bnoud",
      "Boussemghoun",
      "Chellala","El Mehara"
    ]
  }
];

// ============================================================
// Helper functions
// ============================================================

/** إيجاد ولاية بالكود */
export const getWilaya = (code: number | string) =>
  WILAYAS.find((w) => w.code === Number(code));

/** إيجاد ولاية تحتوي على بلدية معينة */
export const getWilayaByCommune = (communeName: string) =>
  WILAYAS.find((w) =>
    w.communes.some((c) => c.toLowerCase() === communeName.toLowerCase())
  );

/** قائمة بلديات ولاية */
export const getCommunesByWilaya = (code: number | string) =>
  getWilaya(code)?.communes ?? [];

/** سعر التوصيل لولاية */
export const getDeliveryPrice = (
  code: number | string,
  type: "home" | "desk" = "home"
) => (type === "home" ? getWilaya(code)?.homePrice : getWilaya(code)?.deskPrice);
