export interface KenyaLocation {
  county: string
  areas: string[]
}

export const kenyaLocations: KenyaLocation[] = [
  {
    county: "Nairobi",
    areas: [
      "CBD", "Westlands", "Karen", "Langata", "Kasarani", "Embakasi", "Dagoretti", 
      "Kibra", "Mathare", "Ruaraka", "Roysambu", "Makadara", "Kamukunji", 
      "Starehe", "Pumwani", "Eastleigh", "South C", "South B", "Kilimani", 
      "Lavington", "Kileleshwa", "Parklands", "Highridge", "Runda", "Muthaiga"
    ]
  },
  {
    county: "Mombasa",
    areas: [
      "Mombasa Island", "Likoni", "Changamwe", "Jomba", "Kisauni", "Nyali", 
      "Bamburi", "Shanzu", "Mtwapa", "Old Town", "Tudor", "Buxton", "Ganjoni"
    ]
  },
  {
    county: "Kiambu",
    areas: [
      "Thika", "Ruiru", "Kikuyu", "Limuru", "Tigoni", "Banana", "Kiambu Town", 
      "Githunguri", "Lari", "Gatundu", "Juja", "Kabete", "Karuri", "Ndenderu"
    ]
  },
  {
    county: "Nakuru",
    areas: [
      "Nakuru Town", "Naivasha", "Gilgil", "Molo", "Njoro", "Rongai", "Subukia", 
      "Bahati", "Kuresoi", "Elementaita", "Hell's Gate", "Lake Nakuru"
    ]
  },
  {
    county: "Machakos",
    areas: [
      "Machakos Town", "Athi River", "Mavoko", "Kangundo", "Matungulu", "Yatta", 
      "Mwala", "Masinga", "Kathiani", "Syokimau", "Mlolongo"
    ]
  },
  {
    county: "Kajiado",
    areas: [
      "Kajiado Town", "Ngong", "Ongata Rongai", "Kitengela", "Namanga", "Bissil", 
      "Loitokitok", "Magadi", "Olkejuado", "Mashuuru", "Kimana"
    ]
  },
  {
    county: "Uasin Gishu",
    areas: [
      "Eldoret", "Moiben", "Soy", "Turbo", "Ainabkoi", "Kapseret", "Kesses", 
      "Ziwa", "Burnt Forest", "Cheptiret", "Pioneer"
    ]
  },
  {
    county: "Kisumu",
    areas: [
      "Kisumu Central", "Kisumu East", "Kisumu West", "Seme", "Nyando", "Muhoroni", 
      "Nyakach", "Kondele", "Mamboleo", "Dunga", "Obunga"
    ]
  },
  {
    county: "Meru",
    areas: [
      "Meru Town", "Maua", "Mikinduri", "Nkubu", "Timau", "Kianjai", "Githongo", 
      "Buuri", "Igembe", "Tigania", "Imenti"
    ]
  },
  {
    county: "Nyeri",
    areas: [
      "Nyeri Town", "Karatina", "Othaya", "Mukurwe-ini", "Tetu", "Mathira", 
      "Kieni", "Narumoru", "Nanyuki", "Nyahururu"
    ]
  },
  {
    county: "Kakamega",
    areas: [
      "Kakamega Town", "Mumias", "Butere", "Khwisero", "Matungu", "Lugari", 
      "Likuyani", "Malava", "Lurambi", "Navakholo", "Shinyalu"
    ]
  },
  {
    county: "Kilifi",
    areas: [
      "Kilifi Town", "Malindi", "Watamu", "Gedi", "Magarini", "Kaloleni", 
      "Rabai", "Chonyi", "Kauma", "Ribe", "Matsangoni"
    ]
  },
  {
    county: "Bungoma",
    areas: [
      "Bungoma Town", "Webuye", "Kimilili", "Sirisia", "Kabuchai", "Bumula", 
      "Kanduyi", "Mt. Elgon", "Cheptais", "Kapsokwony"
    ]
  },
  {
    county: "Kericho",
    areas: [
      "Kericho Town", "Litein", "Sosiot", "Bureti", "Belgut", "Sigowet", 
      "Soin", "Kipkelion", "Ainamoi", "Londiani"
    ]
  },
  {
    county: "Laikipia",
    areas: [
      "Nanyuki", "Nyahururu", "Rumuruti", "Doldol", "Kinamba", "Segera", 
      "Laikipia East", "Laikipia West", "Laikipia North"
    ]
  },
  {
    county: "Murang'a",
    areas: [
      "Murang'a Town", "Thika", "Kenol", "Makuyu", "Maragua", "Kandara", 
      "Gatanga", "Kiharu", "Mathioya", "Kigumo"
    ]
  },
  {
    county: "Embu",
    areas: [
      "Embu Town", "Siakago", "Kyeni", "Runyenjes", "Mbeere North", 
      "Mbeere South", "Gachoka", "Ishiara", "Kiritiri"
    ]
  },
  {
    county: "Kitui",
    areas: [
      "Kitui Town", "Mwingi", "Mutomo", "Ikutha", "Kyuso", "Tseikuru", 
      "Yatta", "Lower Yatta", "Matinyani", "Mulango"
    ]
  },
  {
    county: "Taita Taveta",
    areas: [
      "Voi", "Wundanyi", "Taveta", "Mwatate", "Sagalla", "Kasigau", 
      "Challa", "Kimbo", "Bura"
    ]
  },
  {
    county: "Kwale",
    areas: [
      "Ukunda", "Diani", "Msambweni", "Lunga Lunga", "Matuga", "Kinango", 
      "Samburu", "Tiwi", "Gombato"
    ]
  }
]

export const getCounties = (): string[] => {
  return kenyaLocations.map(location => location.county).sort()
}

export const getAreasByCounty = (county: string): string[] => {
  const location = kenyaLocations.find(loc => loc.county === county)
  return location ? location.areas.sort() : []
}