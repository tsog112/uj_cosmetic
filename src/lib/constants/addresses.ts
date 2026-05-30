export interface Region {
  id: string;
  type: 'aimag' | 'city';
  name_mn: string;
  name_short: string;
  sort_order: number;
}

export interface District {
  id: string;
  region_id: string;
  type: 'duureg' | 'sum';
  name_mn: string;
  name_short: string;
  sort_order: number;
}

export interface Khoroo {
  id: string;
  district_id: string;
  type: 'khoroo' | 'bag';
  name_mn: string;
  sort_order: number;
}

export const REGIONS: Region[] = [
  {
    "id": "1",
    "type": "city",
    "name_mn": "Улаанбаатар хот",
    "name_short": "УБ",
    "sort_order": 1
  },
  {
    "id": "2",
    "type": "aimag",
    "name_mn": "Архангай аймаг",
    "name_short": "Архангай",
    "sort_order": 2
  },
  {
    "id": "3",
    "type": "aimag",
    "name_mn": "Баян-Өлгий аймаг",
    "name_short": "Баян-Өлгий",
    "sort_order": 3
  },
  {
    "id": "4",
    "type": "aimag",
    "name_mn": "Баянхонгор аймаг",
    "name_short": "Баянхонгор",
    "sort_order": 4
  },
  {
    "id": "5",
    "type": "aimag",
    "name_mn": "Булган аймаг",
    "name_short": "Булган",
    "sort_order": 5
  },
  {
    "id": "6",
    "type": "aimag",
    "name_mn": "Говь-Алтай аймаг",
    "name_short": "Говь-Алтай",
    "sort_order": 6
  },
  {
    "id": "7",
    "type": "aimag",
    "name_mn": "Говьсүмбэр аймаг",
    "name_short": "Говьсүмбэр",
    "sort_order": 7
  },
  {
    "id": "8",
    "type": "aimag",
    "name_mn": "Дархан-Уул аймаг",
    "name_short": "Дархан",
    "sort_order": 8
  },
  {
    "id": "9",
    "type": "aimag",
    "name_mn": "Дорноговь аймаг",
    "name_short": "Дорноговь",
    "sort_order": 9
  },
  {
    "id": "10",
    "type": "aimag",
    "name_mn": "Дорнод аймаг",
    "name_short": "Дорнод",
    "sort_order": 10
  },
  {
    "id": "11",
    "type": "aimag",
    "name_mn": "Дундговь аймаг",
    "name_short": "Дундговь",
    "sort_order": 11
  },
  {
    "id": "12",
    "type": "aimag",
    "name_mn": "Завхан аймаг",
    "name_short": "Завхан",
    "sort_order": 12
  },
  {
    "id": "13",
    "type": "aimag",
    "name_mn": "Орхон аймаг",
    "name_short": "Эрдэнэт",
    "sort_order": 13
  },
  {
    "id": "14",
    "type": "aimag",
    "name_mn": "Өвөрхангай аймаг",
    "name_short": "Өвөрхангай",
    "sort_order": 14
  },
  {
    "id": "15",
    "type": "aimag",
    "name_mn": "Өмнөговь аймаг",
    "name_short": "Өмнөговь",
    "sort_order": 15
  },
  {
    "id": "16",
    "type": "aimag",
    "name_mn": "Сүхбаатар аймаг",
    "name_short": "Сүхбаатар",
    "sort_order": 16
  },
  {
    "id": "17",
    "type": "aimag",
    "name_mn": "Сэлэнгэ аймаг",
    "name_short": "Сэлэнгэ",
    "sort_order": 17
  },
  {
    "id": "18",
    "type": "aimag",
    "name_mn": "Төв аймаг",
    "name_short": "Төв",
    "sort_order": 18
  },
  {
    "id": "19",
    "type": "aimag",
    "name_mn": "Увс аймаг",
    "name_short": "Увс",
    "sort_order": 19
  },
  {
    "id": "20",
    "type": "aimag",
    "name_mn": "Ховд аймаг",
    "name_short": "Ховд",
    "sort_order": 20
  },
  {
    "id": "21",
    "type": "aimag",
    "name_mn": "Хөвсгөл аймаг",
    "name_short": "Хөвсгөл",
    "sort_order": 21
  },
  {
    "id": "22",
    "type": "aimag",
    "name_mn": "Хэнтий аймаг",
    "name_short": "Хэнтий",
    "sort_order": 22
  }
];

export const DISTRICTS: District[] = [
  {
    "id": "101",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Баянзүрх дүүрэг",
    "name_short": "БЗД",
    "sort_order": 1
  },
  {
    "id": "102",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Сүхбаатар дүүрэг",
    "name_short": "СБД",
    "sort_order": 2
  },
  {
    "id": "103",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Хан-Уул дүүрэг",
    "name_short": "ХУД",
    "sort_order": 3
  },
  {
    "id": "104",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Чингэлтэй дүүрэг",
    "name_short": "ЧД",
    "sort_order": 4
  },
  {
    "id": "105",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Баянгол дүүрэг",
    "name_short": "БГД",
    "sort_order": 5
  },
  {
    "id": "106",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Налайх дүүрэг",
    "name_short": "НД",
    "sort_order": 6
  },
  {
    "id": "107",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Сонгинохайрхан дүүрэг",
    "name_short": "СХД",
    "sort_order": 7
  },
  {
    "id": "108",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Багануур дүүрэг",
    "name_short": "БНД",
    "sort_order": 8
  },
  {
    "id": "109",
    "region_id": "1",
    "type": "duureg",
    "name_mn": "Багахангай дүүрэг",
    "name_short": "БХД",
    "sort_order": 9
  },
  {
    "id": "MN4804",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Адаацаг сум",
    "name_short": "Адаацаг",
    "sort_order": 101
  },
  {
    "id": "MN4404",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Айраг сум",
    "name_short": "Айраг",
    "sort_order": 102
  },
  {
    "id": "MN6704",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Алаг-Эрдэнэ сум",
    "name_short": "Алаг-Эрдэнэ",
    "sort_order": 103
  },
  {
    "id": "MN8104",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Алдархаан сум",
    "name_short": "Алдархаан",
    "sort_order": 104
  },
  {
    "id": "MN8204",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Алтай сум",
    "name_short": "Алтай",
    "sort_order": 105
  },
  {
    "id": "MN8304",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Алтай сум",
    "name_short": "Алтай",
    "sort_order": 106
  },
  {
    "id": "MN8404",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Алтай сум",
    "name_short": "Алтай",
    "sort_order": 107
  },
  {
    "id": "MN4104",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Алтанбулаг сум",
    "name_short": "Алтанбулаг",
    "sort_order": 108
  },
  {
    "id": "MN4304",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Алтанбулаг сум",
    "name_short": "Алтанбулаг",
    "sort_order": 109
  },
  {
    "id": "MN8307",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Алтанцөгц сум",
    "name_short": "Алтанцөгц",
    "sort_order": 110
  },
  {
    "id": "MN4407",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Алтанширээ сум",
    "name_short": "Алтанширээ",
    "sort_order": 111
  },
  {
    "id": "MN6707",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Арбулаг сум",
    "name_short": "Арбулаг",
    "sort_order": 112
  },
  {
    "id": "MN4107",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Аргалант сум",
    "name_short": "Аргалант",
    "sort_order": 113
  },
  {
    "id": "MN6201",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Арвайхээр сум",
    "name_short": "Арвайхээр",
    "sort_order": 114
  },
  {
    "id": "MN4110",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Архуст сум",
    "name_short": "Архуст",
    "sort_order": 115
  },
  {
    "id": "MN2204",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Асгат сум",
    "name_short": "Асгат",
    "sort_order": 116
  },
  {
    "id": "MN8107",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Асгат сум",
    "name_short": "Асгат",
    "sort_order": 117
  },
  {
    "id": "MN6404",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баацагаан сум",
    "name_short": "Баацагаан",
    "sort_order": 118
  },
  {
    "id": "MN2201",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Баруун-Урт сум",
    "name_short": "Баруун-Урт",
    "sort_order": 119
  },
  {
    "id": "MN6204",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Баруунбаян-Улаан сум",
    "name_short": "Баруунбаян-Улаан",
    "sort_order": 120
  },
  {
    "id": "MN4307",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Баруунбүрэн сум",
    "name_short": "Баруунбүрэн",
    "sort_order": 121
  },
  {
    "id": "MN8504",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Баруунтуруун сум",
    "name_short": "Баруунтуруун",
    "sort_order": 122
  },
  {
    "id": "MN6207",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Бат-Өлзий сум",
    "name_short": "Бат-Өлзий",
    "sort_order": 123
  },
  {
    "id": "MN6504",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Батцэнгэл сум",
    "name_short": "Батцэнгэл",
    "sort_order": 124
  },
  {
    "id": "MN2304",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Батноров сум",
    "name_short": "Батноров",
    "sort_order": 125
  },
  {
    "id": "MN2307",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Батширээт сум",
    "name_short": "Батширээт",
    "sort_order": 126
  },
  {
    "id": "MN4113",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Батсүмбэр сум",
    "name_short": "Батсүмбэр",
    "sort_order": 127
  },
  {
    "id": "MN4116",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баян сум",
    "name_short": "Баян",
    "sort_order": 128
  },
  {
    "id": "MN2310",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Баян-Адарга сум",
    "name_short": "Баян-Адарга",
    "sort_order": 129
  },
  {
    "id": "MN6101",
    "region_id": "13",
    "type": "sum",
    "name_mn": "Баян-Өндөр сум",
    "name_short": "Баян-Өндөр",
    "sort_order": 130
  },
  {
    "id": "MN6213",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Баян-Өндөр сум",
    "name_short": "Баян-Өндөр",
    "sort_order": 131
  },
  {
    "id": "MN6419",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баян-Өндөр сум",
    "name_short": "Баян-Өндөр",
    "sort_order": 132
  },
  {
    "id": "MN4125",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баян-Өнжүүл сум",
    "name_short": "Баян-Өнжүүл",
    "sort_order": 133
  },
  {
    "id": "MN2316",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Баян-Овоо сум",
    "name_short": "Баян-Овоо",
    "sort_order": 134
  },
  {
    "id": "MN4607",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Баян-Овоо сум",
    "name_short": "Баян-Овоо",
    "sort_order": 135
  },
  {
    "id": "MN6416",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баян-Овоо сум",
    "name_short": "Баян-Овоо",
    "sort_order": 136
  },
  {
    "id": "MN2110",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Баян-Уул сум",
    "name_short": "Баян-Уул",
    "sort_order": 137
  },
  {
    "id": "MN8207",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Баян-Уул сум",
    "name_short": "Баян-Уул",
    "sort_order": 138
  },
  {
    "id": "MN6304",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Баян-Агт сум",
    "name_short": "Баян-Агт",
    "sort_order": 139
  },
  {
    "id": "MN6407",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баянбулаг сум",
    "name_short": "Баянбулаг",
    "sort_order": 140
  },
  {
    "id": "MN4131",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баянцагаан сум",
    "name_short": "Баянцагаан",
    "sort_order": 141
  },
  {
    "id": "MN6422",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баянцагаан сум",
    "name_short": "Баянцагаан",
    "sort_order": 142
  },
  {
    "id": "MN4137",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баянчандмань сум",
    "name_short": "Баянчандмань",
    "sort_order": 143
  },
  {
    "id": "MN4134",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баянцогт сум",
    "name_short": "Баянцогт",
    "sort_order": 144
  },
  {
    "id": "MN4604",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Баяндалай сум",
    "name_short": "Баяндалай",
    "sort_order": 145
  },
  {
    "id": "MN2207",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Баяндэлгэр сум",
    "name_short": "Баяндэлгэр",
    "sort_order": 146
  },
  {
    "id": "MN4119",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баяндэлгэр сум",
    "name_short": "Баяндэлгэр",
    "sort_order": 147
  },
  {
    "id": "MN2104",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Баяндун сум",
    "name_short": "Баяндун",
    "sort_order": 148
  },
  {
    "id": "MN4310",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Баянгол сум",
    "name_short": "Баянгол",
    "sort_order": 149
  },
  {
    "id": "MN6210",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Баянгол сум",
    "name_short": "Баянгол",
    "sort_order": 150
  },
  {
    "id": "MN6410",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баянговь сум",
    "name_short": "Баянговь",
    "sort_order": 151
  },
  {
    "id": "MN4122",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баянжаргалан сум",
    "name_short": "Баянжаргалан",
    "sort_order": 152
  },
  {
    "id": "MN4807",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Баянжаргалан сум",
    "name_short": "Баянжаргалан",
    "sort_order": 153
  },
  {
    "id": "MN6413",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баянлиг сум",
    "name_short": "Баянлиг",
    "sort_order": 154
  },
  {
    "id": "MN2313",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Баянмөнх сум",
    "name_short": "Баянмөнх",
    "sort_order": 155
  },
  {
    "id": "MN6307",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Баяннуур сум",
    "name_short": "Баяннуур",
    "sort_order": 156
  },
  {
    "id": "MN8310",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Баяннуур сум",
    "name_short": "Баяннуур",
    "sort_order": 157
  },
  {
    "id": "MN4204",
    "region_id": "7",
    "type": "sum",
    "name_mn": "Баянтал сум",
    "name_short": "Баянтал",
    "sort_order": 158
  },
  {
    "id": "MN8110",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Баянтэс сум",
    "name_short": "Баянтэс",
    "sort_order": 159
  },
  {
    "id": "MN2107",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Баянтүмэн сум",
    "name_short": "Баянтүмэн",
    "sort_order": 160
  },
  {
    "id": "MN8113",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Баянхайрхан сум",
    "name_short": "Баянхайрхан",
    "sort_order": 161
  },
  {
    "id": "MN4128",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Баянхангай сум",
    "name_short": "Баянхангай",
    "sort_order": 162
  },
  {
    "id": "MN6401",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Баянхонгор сум",
    "name_short": "Баянхонгор",
    "sort_order": 163
  },
  {
    "id": "MN2319",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Баянхутаг сум",
    "name_short": "Баянхутаг",
    "sort_order": 164
  },
  {
    "id": "MN6710",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Баянзүрх сум",
    "name_short": "Баянзүрх",
    "sort_order": 165
  },
  {
    "id": "MN8210",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Бигэр сум",
    "name_short": "Бигэр",
    "sort_order": 166
  },
  {
    "id": "MN2322",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Биндэр сум",
    "name_short": "Биндэр",
    "sort_order": 167
  },
  {
    "id": "MN6428",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Бөмбөгөр сум",
    "name_short": "Бөмбөгөр",
    "sort_order": 168
  },
  {
    "id": "MN8507",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Бөхмөрөн сум",
    "name_short": "Бөхмөрөн",
    "sort_order": 169
  },
  {
    "id": "MN6216",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Богд сум",
    "name_short": "Богд",
    "sort_order": 170
  },
  {
    "id": "MN6425",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Богд сум",
    "name_short": "Богд",
    "sort_order": 171
  },
  {
    "id": "MN2352",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Бор-Өндөр сум",
    "name_short": "Бор-Өндөр",
    "sort_order": 172
  },
  {
    "id": "MN4140",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Борнуур сум",
    "name_short": "Борнуур",
    "sort_order": 173
  },
  {
    "id": "MN6219",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Бүрд сум",
    "name_short": "Бүрд",
    "sort_order": 174
  },
  {
    "id": "MN6313",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Бүрэгхангай сум",
    "name_short": "Бүрэгхангай",
    "sort_order": 175
  },
  {
    "id": "MN4143",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Бүрэн сум",
    "name_short": "Бүрэн",
    "sort_order": 176
  },
  {
    "id": "MN6713",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Бүрэнтогтох сум",
    "name_short": "Бүрэнтогтох",
    "sort_order": 177
  },
  {
    "id": "MN6310",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Бугат сум",
    "name_short": "Бугат",
    "sort_order": 178
  },
  {
    "id": "MN8213",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Бугат сум",
    "name_short": "Бугат",
    "sort_order": 179
  },
  {
    "id": "MN8313",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Бугат сум",
    "name_short": "Бугат",
    "sort_order": 180
  },
  {
    "id": "MN2113",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 181
  },
  {
    "id": "MN4610",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 182
  },
  {
    "id": "MN6301",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 183
  },
  {
    "id": "MN6507",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 184
  },
  {
    "id": "MN8316",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 185
  },
  {
    "id": "MN8407",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Булган сум",
    "name_short": "Булган",
    "sort_order": 186
  },
  {
    "id": "MN6431",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Бууцагаан сум",
    "name_short": "Бууцагаан",
    "sort_order": 187
  },
  {
    "id": "MN8319",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Буянт сум",
    "name_short": "Буянт",
    "sort_order": 188
  },
  {
    "id": "MN8410",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Буянт сум",
    "name_short": "Буянт",
    "sort_order": 189
  },
  {
    "id": "MN2134",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Цагаан-Овоо сум",
    "name_short": "Цагаан-Овоо",
    "sort_order": 190
  },
  {
    "id": "MN6755",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Цагаан-Үүр сум",
    "name_short": "Цагаан-Үүр",
    "sort_order": 191
  },
  {
    "id": "MN6752",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Цагаан-Уул сум",
    "name_short": "Цагаан-Уул",
    "sort_order": 192
  },
  {
    "id": "MN8158",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Цагаанчулуут сум",
    "name_short": "Цагаанчулуут",
    "sort_order": 193
  },
  {
    "id": "MN4840",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Цагаандэлгэр сум",
    "name_short": "Цагаандэлгэр",
    "sort_order": 194
  },
  {
    "id": "MN4346",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Цагааннуур сум",
    "name_short": "Цагааннуур",
    "sort_order": 195
  },
  {
    "id": "MN6749",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Цагааннуур сум",
    "name_short": "Цагааннуур",
    "sort_order": 196
  },
  {
    "id": "MN8155",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Цагаанхайрхан сум",
    "name_short": "Цагаанхайрхан",
    "sort_order": 197
  },
  {
    "id": "MN8555",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Цагаанхайрхан сум",
    "name_short": "Цагаанхайрхан",
    "sort_order": 198
  },
  {
    "id": "MN6543",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Цахир сум",
    "name_short": "Цахир",
    "sort_order": 199
  },
  {
    "id": "MN8443",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Цэцэг сум",
    "name_short": "Цэцэг",
    "sort_order": 200
  },
  {
    "id": "MN8161",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Цэцэн-Уул сум",
    "name_short": "Цэцэн-Уул",
    "sort_order": 201
  },
  {
    "id": "MN6549",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Цэцэрлэг сум",
    "name_short": "Цэцэрлэг",
    "sort_order": 202
  },
  {
    "id": "MN6758",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Цэцэрлэг сум",
    "name_short": "Цэцэрлэг",
    "sort_order": 203
  },
  {
    "id": "MN4173",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Цээл сум",
    "name_short": "Цээл",
    "sort_order": 204
  },
  {
    "id": "MN8243",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Цээл сум",
    "name_short": "Цээл",
    "sort_order": 205
  },
  {
    "id": "MN8340",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Цэнгэл сум",
    "name_short": "Цэнгэл",
    "sort_order": 206
  },
  {
    "id": "MN6546",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Цэнхэр сум",
    "name_short": "Цэнхэр",
    "sort_order": 207
  },
  {
    "id": "MN2349",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Цэнхэрмандал сум",
    "name_short": "Цэнхэрмандал",
    "sort_order": 208
  },
  {
    "id": "MN8246",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Чандмань сум",
    "name_short": "Чандмань",
    "sort_order": 209
  },
  {
    "id": "MN8446",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Чандмань сум",
    "name_short": "Чандмань",
    "sort_order": 210
  },
  {
    "id": "MN6761",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Чандмань-Өндөр сум",
    "name_short": "Чандмань-Өндөр",
    "sort_order": 211
  },
  {
    "id": "MN2137",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Чойбалсан сум",
    "name_short": "Чойбалсан",
    "sort_order": 212
  },
  {
    "id": "MN2140",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Чулуунхороот сум",
    "name_short": "Чулуунхороот",
    "sort_order": 213
  },
  {
    "id": "MN6552",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Чулуут сум",
    "name_short": "Чулуут",
    "sort_order": 214
  },
  {
    "id": "MN8240",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Цогт сум",
    "name_short": "Цогт",
    "sort_order": 215
  },
  {
    "id": "MN4643",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Цогтцэций сум",
    "name_short": "Цогтцэций",
    "sort_order": 216
  },
  {
    "id": "MN4640",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Цогт-Овоо сум",
    "name_short": "Цогт-Овоо",
    "sort_order": 217
  },
  {
    "id": "MN2328",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Дадал сум",
    "name_short": "Дадал",
    "sort_order": 218
  },
  {
    "id": "MN4410",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Даланжаргалан сум",
    "name_short": "Даланжаргалан",
    "sort_order": 219
  },
  {
    "id": "MN4601",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Даланзадгад сум",
    "name_short": "Даланзадгад",
    "sort_order": 220
  },
  {
    "id": "MN2210",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Дарьганга сум",
    "name_short": "Дарьганга",
    "sort_order": 221
  },
  {
    "id": "MN8413",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Дарви сум",
    "name_short": "Дарви",
    "sort_order": 222
  },
  {
    "id": "MN8216",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Дарив сум",
    "name_short": "Дарив",
    "sort_order": 223
  },
  {
    "id": "MN2331",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Дархан сум",
    "name_short": "Дархан",
    "sort_order": 224
  },
  {
    "id": "MN4501",
    "region_id": "8",
    "type": "sum",
    "name_mn": "Дархан сум",
    "name_short": "Дархан",
    "sort_order": 225
  },
  {
    "id": "MN2119",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Дашбалбар сум",
    "name_short": "Дашбалбар",
    "sort_order": 226
  },
  {
    "id": "MN6319",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Дашинчилэн сум",
    "name_short": "Дашинчилэн",
    "sort_order": 227
  },
  {
    "id": "MN8510",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Давст сум",
    "name_short": "Давст",
    "sort_order": 228
  },
  {
    "id": "MN8219",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Дэлгэр сум",
    "name_short": "Дэлгэр",
    "sort_order": 229
  },
  {
    "id": "MN4819",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Дэлгэрцогт сум",
    "name_short": "Дэлгэрцогт",
    "sort_order": 230
  },
  {
    "id": "MN4413",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Дэлгэрэх сум",
    "name_short": "Дэлгэрэх",
    "sort_order": 231
  },
  {
    "id": "MN2334",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Дэлгэрхаан сум",
    "name_short": "Дэлгэрхаан",
    "sort_order": 232
  },
  {
    "id": "MN4146",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Дэлгэрхаан сум",
    "name_short": "Дэлгэрхаан",
    "sort_order": 233
  },
  {
    "id": "MN4816",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Дэлгэрхангай сум",
    "name_short": "Дэлгэрхангай",
    "sort_order": 234
  },
  {
    "id": "MN8322",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Дэлүүн сум",
    "name_short": "Дэлүүн",
    "sort_order": 235
  },
  {
    "id": "MN4822",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Дэрэн сум",
    "name_short": "Дэрэн",
    "sort_order": 236
  },
  {
    "id": "MN8416",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Дөргөн сум",
    "name_short": "Дөргөн",
    "sort_order": 237
  },
  {
    "id": "MN8116",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Дөрвөлжин сум",
    "name_short": "Дөрвөлжин",
    "sort_order": 238
  },
  {
    "id": "MN8419",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Дуут сум",
    "name_short": "Дуут",
    "sort_order": 239
  },
  {
    "id": "MN4176",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Эрдэнэ сум",
    "name_short": "Эрдэнэ",
    "sort_order": 240
  },
  {
    "id": "MN4440",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Эрдэнэ сум",
    "name_short": "Эрдэнэ",
    "sort_order": 241
  },
  {
    "id": "MN8252",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Эрдэнэ сум",
    "name_short": "Эрдэнэ",
    "sort_order": 242
  },
  {
    "id": "MN8449",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Эрдэнэбүрэн сум",
    "name_short": "Эрдэнэбүрэн",
    "sort_order": 243
  },
  {
    "id": "MN6501",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Эрдэнэбулган сум",
    "name_short": "Эрдэнэбулган",
    "sort_order": 244
  },
  {
    "id": "MN6767",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Эрдэнэбулган сум",
    "name_short": "Эрдэнэбулган",
    "sort_order": 245
  },
  {
    "id": "MN2237",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Эрдэнэцагаан сум",
    "name_short": "Эрдэнэцагаан",
    "sort_order": 246
  },
  {
    "id": "MN6458",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Эрдэнэцогт сум",
    "name_short": "Эрдэнэцогт",
    "sort_order": 247
  },
  {
    "id": "MN4843",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Эрдэнэдалай сум",
    "name_short": "Эрдэнэдалай",
    "sort_order": 248
  },
  {
    "id": "MN6555",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Эрдэнэмандал сум",
    "name_short": "Эрдэнэмандал",
    "sort_order": 249
  },
  {
    "id": "MN4179",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Эрдэнэсант сум",
    "name_short": "Эрдэнэсант",
    "sort_order": 250
  },
  {
    "id": "MN8167",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Эрдэнэхайрхан сум",
    "name_short": "Эрдэнэхайрхан",
    "sort_order": 251
  },
  {
    "id": "MN2325",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Галшар сум",
    "name_short": "Галшар",
    "sort_order": 252
  },
  {
    "id": "MN6716",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Галт сум",
    "name_short": "Галт",
    "sort_order": 253
  },
  {
    "id": "MN6434",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Галуут сум",
    "name_short": "Галуут",
    "sort_order": 254
  },
  {
    "id": "MN4810",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Говь-Угтаал сум",
    "name_short": "Говь-Угтаал",
    "sort_order": 255
  },
  {
    "id": "MN6222",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Гучин-Ус сум",
    "name_short": "Гучин-Ус",
    "sort_order": 256
  },
  {
    "id": "MN6316",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Гурван булаг сум",
    "name_short": "Гурван булаг",
    "sort_order": 257
  },
  {
    "id": "MN6437",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Гурванбулаг сум",
    "name_short": "Гурванбулаг",
    "sort_order": 258
  },
  {
    "id": "MN4813",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Гурвансайхан сум",
    "name_short": "Гурвансайхан",
    "sort_order": 259
  },
  {
    "id": "MN4613",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Гурвантэс сум",
    "name_short": "Гурвантэс",
    "sort_order": 260
  },
  {
    "id": "MN2116",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Гурванзагал сум",
    "name_short": "Гурванзагал",
    "sort_order": 261
  },
  {
    "id": "MN2101",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Хэрлэн сум",
    "name_short": "Хэрлэн",
    "sort_order": 262
  },
  {
    "id": "MN8122",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Идэр сум",
    "name_short": "Идэр",
    "sort_order": 263
  },
  {
    "id": "MN6722",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Их-Уул сум",
    "name_short": "Их-Уул",
    "sort_order": 264
  },
  {
    "id": "MN8125",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Их-Уул сум",
    "name_short": "Их-Уул",
    "sort_order": 265
  },
  {
    "id": "MN4419",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Иххэт сум",
    "name_short": "Иххэт",
    "sort_order": 266
  },
  {
    "id": "MN6513",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Их тамир сум",
    "name_short": "Их тамир",
    "sort_order": 267
  },
  {
    "id": "MN8222",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Жаргалан сум",
    "name_short": "Жаргалан",
    "sort_order": 268
  },
  {
    "id": "MN4149",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 269
  },
  {
    "id": "MN6104",
    "region_id": "13",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 270
  },
  {
    "id": "MN6440",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 271
  },
  {
    "id": "MN6510",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 272
  },
  {
    "id": "MN6719",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 273
  },
  {
    "id": "MN8401",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Жаргалант сум",
    "name_short": "Жаргалант",
    "sort_order": 274
  },
  {
    "id": "MN2337",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Жаргалтхаан сум",
    "name_short": "Жаргалтхаан",
    "sort_order": 275
  },
  {
    "id": "MN4316",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Жавхлант сум",
    "name_short": "Жавхлант",
    "sort_order": 276
  },
  {
    "id": "MN6443",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Жинст сум",
    "name_short": "Жинст",
    "sort_order": 277
  },
  {
    "id": "MN4155",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Лүн сум",
    "name_short": "Лүн",
    "sort_order": 278
  },
  {
    "id": "MN4825",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Луус сум",
    "name_short": "Луус",
    "sort_order": 279
  },
  {
    "id": "MN8522",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Малчин сум",
    "name_short": "Малчин",
    "sort_order": 280
  },
  {
    "id": "MN4322",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Мандал сум",
    "name_short": "Мандал",
    "sort_order": 281
  },
  {
    "id": "MN4616",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Мандал-Овоо сум",
    "name_short": "Мандал-Овоо",
    "sort_order": 282
  },
  {
    "id": "MN4422",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Мандах сум",
    "name_short": "Мандах",
    "sort_order": 283
  },
  {
    "id": "MN4619",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Манлай сум",
    "name_short": "Манлай",
    "sort_order": 284
  },
  {
    "id": "MN8425",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Манхан сум",
    "name_short": "Манхан",
    "sort_order": 285
  },
  {
    "id": "MN2122",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Матад сум",
    "name_short": "Матад",
    "sort_order": 286
  },
  {
    "id": "MN4158",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Мөнгөнморьт сум",
    "name_short": "Мөнгөнморьт",
    "sort_order": 287
  },
  {
    "id": "MN2213",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Мөнххаан сум",
    "name_short": "Мөнххаан",
    "sort_order": 288
  },
  {
    "id": "MN8428",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Мөнххайрхан сум",
    "name_short": "Мөнххайрхан",
    "sort_order": 289
  },
  {
    "id": "MN2340",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Мөрөн сум",
    "name_short": "Мөрөн",
    "sort_order": 290
  },
  {
    "id": "MN6701",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Мөрөн сум",
    "name_short": "Мөрөн",
    "sort_order": 291
  },
  {
    "id": "MN8431",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Мөст сум",
    "name_short": "Мөст",
    "sort_order": 292
  },
  {
    "id": "MN6322",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Могод сум",
    "name_short": "Могод",
    "sort_order": 293
  },
  {
    "id": "MN8434",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Мянгад сум",
    "name_short": "Мянгад",
    "sort_order": 294
  },
  {
    "id": "MN2216",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Наран сум",
    "name_short": "Наран",
    "sort_order": 295
  },
  {
    "id": "MN8525",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Наранбулаг сум",
    "name_short": "Наранбулаг",
    "sort_order": 296
  },
  {
    "id": "MN6231",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Нарийнтээл сум",
    "name_short": "Нарийнтээл",
    "sort_order": 297
  },
  {
    "id": "MN8128",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Нөмрөг сум",
    "name_short": "Нөмрөг",
    "sort_order": 298
  },
  {
    "id": "MN8325",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Ногооннуур сум",
    "name_short": "Ногооннуур",
    "sort_order": 299
  },
  {
    "id": "MN4625",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Номгон сум",
    "name_short": "Номгон",
    "sort_order": 300
  },
  {
    "id": "MN2343",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Норовлин сум",
    "name_short": "Норовлин",
    "sort_order": 301
  },
  {
    "id": "MN4622",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Ноён сум",
    "name_short": "Ноён",
    "sort_order": 302
  },
  {
    "id": "MN6516",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Өгийнуур сум",
    "name_short": "Өгийнуур",
    "sort_order": 303
  },
  {
    "id": "MN8301",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Өлгий сум",
    "name_short": "Өлгий",
    "sort_order": 304
  },
  {
    "id": "MN8528",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Өлгий сум",
    "name_short": "Өлгий",
    "sort_order": 305
  },
  {
    "id": "MN4828",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Өлзийт сум",
    "name_short": "Өлзийт",
    "sort_order": 306
  },
  {
    "id": "MN6234",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Өлзийт сум",
    "name_short": "Өлзийт",
    "sort_order": 307
  },
  {
    "id": "MN6449",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Өлзийт сум",
    "name_short": "Өлзийт",
    "sort_order": 308
  },
  {
    "id": "MN6519",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Өлзийт сум",
    "name_short": "Өлзийт",
    "sort_order": 309
  },
  {
    "id": "MN2346",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Өмнөдэлгэр сум",
    "name_short": "Өмнөдэлгэр",
    "sort_order": 310
  },
  {
    "id": "MN8531",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Өмнөгөвь сум",
    "name_short": "Өмнөгөвь",
    "sort_order": 311
  },
  {
    "id": "MN6522",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Өндөр-Улаан сум",
    "name_short": "Өндөр-Улаан",
    "sort_order": 312
  },
  {
    "id": "MN4831",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Өндөршил сум",
    "name_short": "Өндөршил",
    "sort_order": 313
  },
  {
    "id": "MN4161",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Өндөрширээт сум",
    "name_short": "Өндөрширээт",
    "sort_order": 314
  },
  {
    "id": "MN8534",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Өндөрхангай сум",
    "name_short": "Өндөрхангай",
    "sort_order": 315
  },
  {
    "id": "MN4425",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Өргөн сум",
    "name_short": "Өргөн",
    "sort_order": 316
  },
  {
    "id": "MN2219",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Онгон сум",
    "name_short": "Онгон",
    "sort_order": 317
  },
  {
    "id": "MN4325",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Орхон сум",
    "name_short": "Орхон",
    "sort_order": 318
  },
  {
    "id": "MN4504",
    "region_id": "8",
    "type": "sum",
    "name_mn": "Орхон сум",
    "name_short": "Орхон",
    "sort_order": 319
  },
  {
    "id": "MN6325",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Орхон сум",
    "name_short": "Орхон",
    "sort_order": 320
  },
  {
    "id": "MN4328",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Орхонтуул сум",
    "name_short": "Орхонтуул",
    "sort_order": 321
  },
  {
    "id": "MN8131",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Отгон сум",
    "name_short": "Отгон",
    "sort_order": 322
  },
  {
    "id": "MN6328",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Рашаант сум",
    "name_short": "Рашаант",
    "sort_order": 323
  },
  {
    "id": "MN6725",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Рашаант сум",
    "name_short": "Рашаант",
    "sort_order": 324
  },
  {
    "id": "MN6728",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Рэнчинлхүмбэ сум",
    "name_short": "Рэнчинлхүмбэ",
    "sort_order": 325
  },
  {
    "id": "MN8537",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Сагил сум",
    "name_short": "Сагил",
    "sort_order": 326
  },
  {
    "id": "MN8328",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Сагсай сум",
    "name_short": "Сагсай",
    "sort_order": 327
  },
  {
    "id": "MN4401",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Сайншанд сум",
    "name_short": "Сайншанд",
    "sort_order": 328
  },
  {
    "id": "MN4801",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Сайнцагаан сум",
    "name_short": "Сайнцагаан",
    "sort_order": 329
  },
  {
    "id": "MN4331",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Сайхан сум",
    "name_short": "Сайхан",
    "sort_order": 330
  },
  {
    "id": "MN6331",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Сайхан сум",
    "name_short": "Сайхан",
    "sort_order": 331
  },
  {
    "id": "MN4834",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Сайхан-Овоо сум",
    "name_short": "Сайхан-Овоо",
    "sort_order": 332
  },
  {
    "id": "MN4428",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Сайхандулаан сум",
    "name_short": "Сайхандулаан",
    "sort_order": 333
  },
  {
    "id": "MN4334",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Сант сум",
    "name_short": "Сант",
    "sort_order": 334
  },
  {
    "id": "MN6237",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Сант сум",
    "name_short": "Сант",
    "sort_order": 335
  },
  {
    "id": "MN8134",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Сантмаргац сум",
    "name_short": "Сантмаргац",
    "sort_order": 336
  },
  {
    "id": "MN6334",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Сэлэнгэ сум",
    "name_short": "Сэлэнгэ",
    "sort_order": 337
  },
  {
    "id": "MN2125",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Сэргэлэн сум",
    "name_short": "Сэргэлэн",
    "sort_order": 338
  },
  {
    "id": "MN4167",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Сэргэлэн сум",
    "name_short": "Сэргэлэн",
    "sort_order": 339
  },
  {
    "id": "MN4628",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Сэврэй сум",
    "name_short": "Сэврэй",
    "sort_order": 340
  },
  {
    "id": "MN4349",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Шаамар сум",
    "name_short": "Шаамар",
    "sort_order": 341
  },
  {
    "id": "MN8249",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Шарга сум",
    "name_short": "Шарга",
    "sort_order": 342
  },
  {
    "id": "MN4510",
    "region_id": "8",
    "type": "sum",
    "name_mn": "Шарын гол сум",
    "name_short": "Шарын гол",
    "sort_order": 343
  },
  {
    "id": "MN8164",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Шилүүстэй сум",
    "name_short": "Шилүүстэй",
    "sort_order": 344
  },
  {
    "id": "MN6764",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Шинэ-Идэр сум",
    "name_short": "Шинэ-Идэр",
    "sort_order": 345
  },
  {
    "id": "MN6455",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Шинэжинст сум",
    "name_short": "Шинэжинст",
    "sort_order": 346
  },
  {
    "id": "MN4207",
    "region_id": "7",
    "type": "sum",
    "name_mn": "Шивээговь сум",
    "name_short": "Шивээговь",
    "sort_order": 347
  },
  {
    "id": "MN8137",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Сонгино сум",
    "name_short": "Сонгино",
    "sort_order": 348
  },
  {
    "id": "MN4164",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Сүмбэр сум",
    "name_short": "Сүмбэр",
    "sort_order": 349
  },
  {
    "id": "MN4201",
    "region_id": "7",
    "type": "sum",
    "name_mn": "Сүмбэр сум",
    "name_short": "Сүмбэр",
    "sort_order": 350
  },
  {
    "id": "MN2222",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Сүхбаатар сум",
    "name_short": "Сүхбаатар",
    "sort_order": 351
  },
  {
    "id": "MN4301",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Сүхбаатар сум",
    "name_short": "Сүхбаатар",
    "sort_order": 352
  },
  {
    "id": "MN8225",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Тайшир сум",
    "name_short": "Тайшир",
    "sort_order": 353
  },
  {
    "id": "MN6240",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Тарагт сум",
    "name_short": "Тарагт",
    "sort_order": 354
  },
  {
    "id": "MN6731",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Тариалан сум",
    "name_short": "Тариалан",
    "sort_order": 355
  },
  {
    "id": "MN8540",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Тариалан сум",
    "name_short": "Тариалан",
    "sort_order": 356
  },
  {
    "id": "MN6525",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Тариат сум",
    "name_short": "Тариат",
    "sort_order": 357
  },
  {
    "id": "MN8146",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Тэлмэн сум",
    "name_short": "Тэлмэн",
    "sort_order": 358
  },
  {
    "id": "MN8149",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Тэс сум",
    "name_short": "Тэс",
    "sort_order": 359
  },
  {
    "id": "MN8546",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Тэс сум",
    "name_short": "Тэс",
    "sort_order": 360
  },
  {
    "id": "MN6337",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Тэшиг сум",
    "name_short": "Тэшиг",
    "sort_order": 361
  },
  {
    "id": "MN6243",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Төгрөг сум",
    "name_short": "Төгрөг",
    "sort_order": 362
  },
  {
    "id": "MN8231",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Төгрөг сум",
    "name_short": "Төгрөг",
    "sort_order": 363
  },
  {
    "id": "MN6737",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Төмөрбулаг сум",
    "name_short": "Төмөрбулаг",
    "sort_order": 364
  },
  {
    "id": "MN6528",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Төвшрүүлэх сум",
    "name_short": "Төвшрүүлэх",
    "sort_order": 365
  },
  {
    "id": "MN8331",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Толбо сум",
    "name_short": "Толбо",
    "sort_order": 366
  },
  {
    "id": "MN8228",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Тонхил сум",
    "name_short": "Тонхил",
    "sort_order": 367
  },
  {
    "id": "MN6734",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Тосонцэнгэл сум",
    "name_short": "Тосонцэнгэл",
    "sort_order": 368
  },
  {
    "id": "MN8140",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Тосонцэнгэл сум",
    "name_short": "Тосонцэнгэл",
    "sort_order": 369
  },
  {
    "id": "MN8143",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Түдэвтэй сум",
    "name_short": "Түдэвтэй",
    "sort_order": 370
  },
  {
    "id": "MN2228",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Түмэнцогт сум",
    "name_short": "Түмэнцогт",
    "sort_order": 371
  },
  {
    "id": "MN6740",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Түнэл сум",
    "name_short": "Түнэл",
    "sort_order": 372
  },
  {
    "id": "MN8543",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Түргэн сум",
    "name_short": "Түргэн",
    "sort_order": 373
  },
  {
    "id": "MN4337",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Түшиг сум",
    "name_short": "Түшиг",
    "sort_order": 374
  },
  {
    "id": "MN2225",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Түвшинширээ сум",
    "name_short": "Түвшинширээ",
    "sort_order": 375
  },
  {
    "id": "MN8437",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Үенч сум",
    "name_short": "Үенч",
    "sort_order": 376
  },
  {
    "id": "MN4170",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Угтаалцайдам сум",
    "name_short": "Угтаалцайдам",
    "sort_order": 377
  },
  {
    "id": "MN6743",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Улаан-Уул сум",
    "name_short": "Улаан-Уул",
    "sort_order": 378
  },
  {
    "id": "MN4431",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Улаанбадрах сум",
    "name_short": "Улаанбадрах",
    "sort_order": 379
  },
  {
    "id": "MN8501",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Улаангом сум",
    "name_short": "Улаангом",
    "sort_order": 380
  },
  {
    "id": "MN8334",
    "region_id": "3",
    "type": "sum",
    "name_mn": "Улаанхус сум",
    "name_short": "Улаанхус",
    "sort_order": 381
  },
  {
    "id": "MN8101",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Улиастай сум",
    "name_short": "Улиастай",
    "sort_order": 382
  },
  {
    "id": "MN8152",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Ургамал сум",
    "name_short": "Ургамал",
    "sort_order": 383
  },
  {
    "id": "MN2231",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Уулбаян сум",
    "name_short": "Уулбаян",
    "sort_order": 384
  },
  {
    "id": "MN6246",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Уянга сум",
    "name_short": "Уянга",
    "sort_order": 385
  },
  {
    "id": "MN6531",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Хайрхан сум",
    "name_short": "Хайрхан",
    "sort_order": 386
  },
  {
    "id": "MN6249",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Хайрхандулаан сум",
    "name_short": "Хайрхандулаан",
    "sort_order": 387
  },
  {
    "id": "MN8234",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Халиун сум",
    "name_short": "Халиун",
    "sort_order": 388
  },
  {
    "id": "MN2128",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Халхгол сум",
    "name_short": "Халхгол",
    "sort_order": 389
  },
  {
    "id": "MN2234",
    "region_id": "16",
    "type": "sum",
    "name_mn": "Халзан сум",
    "name_short": "Халзан",
    "sort_order": 390
  },
  {
    "id": "MN4631",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Ханбогд сум",
    "name_short": "Ханбогд",
    "sort_order": 391
  },
  {
    "id": "MN6534",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Хангай сум",
    "name_short": "Хангай",
    "sort_order": 392
  },
  {
    "id": "MN6340",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Хангал сум",
    "name_short": "Хангал",
    "sort_order": 393
  },
  {
    "id": "MN6746",
    "region_id": "21",
    "type": "sum",
    "name_mn": "Ханх сум",
    "name_short": "Ханх",
    "sort_order": 394
  },
  {
    "id": "MN4634",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Ханхонгор сум",
    "name_short": "Ханхонгор",
    "sort_order": 395
  },
  {
    "id": "MN6252",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Хархорин сум",
    "name_short": "Хархорин",
    "sort_order": 396
  },
  {
    "id": "MN6537",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Хашаат сум",
    "name_short": "Хашаат",
    "sort_order": 397
  },
  {
    "id": "MN4434",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Хатанбулаг сум",
    "name_short": "Хатанбулаг",
    "sort_order": 398
  },
  {
    "id": "MN2301",
    "region_id": "22",
    "type": "sum",
    "name_mn": "Хэрлэн сум",
    "name_short": "Хэрлэн",
    "sort_order": 399
  },
  {
    "id": "MN6343",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Хишиг-өндөр сум",
    "name_short": "Хишиг-өндөр",
    "sort_order": 400
  },
  {
    "id": "MN2131",
    "region_id": "10",
    "type": "sum",
    "name_mn": "Хөлөнбуйр сум",
    "name_short": "Хөлөнбуйр",
    "sort_order": 401
  },
  {
    "id": "MN4437",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Хөвсгөл сум",
    "name_short": "Хөвсгөл",
    "sort_order": 402
  },
  {
    "id": "MN8237",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Хөхморьт сум",
    "name_short": "Хөхморьт",
    "sort_order": 403
  },
  {
    "id": "MN4507",
    "region_id": "8",
    "type": "sum",
    "name_mn": "Хонгор сум",
    "name_short": "Хонгор",
    "sort_order": 404
  },
  {
    "id": "MN6540",
    "region_id": "2",
    "type": "sum",
    "name_mn": "Хотонт сум",
    "name_short": "Хотонт",
    "sort_order": 405
  },
  {
    "id": "MN8440",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Ховд сум",
    "name_short": "Ховд",
    "sort_order": 406
  },
  {
    "id": "MN8549",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Ховд сум",
    "name_short": "Ховд",
    "sort_order": 407
  },
  {
    "id": "MN4340",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Хүдэр сум",
    "name_short": "Хүдэр",
    "sort_order": 408
  },
  {
    "id": "MN6452",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Хүрээмарал сум",
    "name_short": "Хүрээмарал",
    "sort_order": 409
  },
  {
    "id": "MN4637",
    "region_id": "15",
    "type": "sum",
    "name_mn": "Хүрмэн сум",
    "name_short": "Хүрмэн",
    "sort_order": 410
  },
  {
    "id": "MN6255",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Хужирт сум",
    "name_short": "Хужирт",
    "sort_order": 411
  },
  {
    "id": "MN4837",
    "region_id": "11",
    "type": "sum",
    "name_mn": "Хулд сум",
    "name_short": "Хулд",
    "sort_order": 412
  },
  {
    "id": "MN4343",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Хушаат сум",
    "name_short": "Хушаат",
    "sort_order": 413
  },
  {
    "id": "MN6346",
    "region_id": "5",
    "type": "sum",
    "name_mn": "Хутаг-Өндөр сум",
    "name_short": "Хутаг-Өндөр",
    "sort_order": 414
  },
  {
    "id": "MN8552",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Хяргас сум",
    "name_short": "Хяргас",
    "sort_order": 415
  },
  {
    "id": "MN8170",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Яруу сум",
    "name_short": "Яруу",
    "sort_order": 416
  },
  {
    "id": "MN4313",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Ерөө сум",
    "name_short": "Ерөө",
    "sort_order": 417
  },
  {
    "id": "MN8201",
    "region_id": "6",
    "type": "sum",
    "name_mn": "Есөнбулаг сум",
    "name_short": "Есөнбулаг",
    "sort_order": 418
  },
  {
    "id": "MN6225",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Есөн зүйл сум",
    "name_short": "Есөн зүйл",
    "sort_order": 419
  },
  {
    "id": "MN4152",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Заамар сум",
    "name_short": "Заамар",
    "sort_order": 420
  },
  {
    "id": "MN6446",
    "region_id": "4",
    "type": "sum",
    "name_mn": "Заг сум",
    "name_short": "Заг",
    "sort_order": 421
  },
  {
    "id": "MN4416",
    "region_id": "9",
    "type": "sum",
    "name_mn": "Замын-Үүд сум",
    "name_short": "Замын-Үүд",
    "sort_order": 422
  },
  {
    "id": "MN8513",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Завхан сум",
    "name_short": "Завхан",
    "sort_order": 423
  },
  {
    "id": "MN8119",
    "region_id": "12",
    "type": "sum",
    "name_mn": "Завханмандал сум",
    "name_short": "Завханмандал",
    "sort_order": 424
  },
  {
    "id": "MN8422",
    "region_id": "20",
    "type": "sum",
    "name_mn": "Зэрэг сум",
    "name_short": "Зэрэг",
    "sort_order": 425
  },
  {
    "id": "MN6228",
    "region_id": "14",
    "type": "sum",
    "name_mn": "Зүүнбаян-Улаан сум",
    "name_short": "Зүүнбаян-Улаан",
    "sort_order": 426
  },
  {
    "id": "MN4319",
    "region_id": "17",
    "type": "sum",
    "name_mn": "Зүүнбүрэн сум",
    "name_short": "Зүүнбүрэн",
    "sort_order": 427
  },
  {
    "id": "MN8516",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Зүүнговь сум",
    "name_short": "Зүүнговь",
    "sort_order": 428
  },
  {
    "id": "MN8519",
    "region_id": "19",
    "type": "sum",
    "name_mn": "Зүүнхангай сум",
    "name_short": "Зүүнхангай",
    "sort_order": 429
  },
  {
    "id": "MN4101",
    "region_id": "18",
    "type": "sum",
    "name_mn": "Зуунмод сум",
    "name_short": "Зуунмод",
    "sort_order": 430
  }
];

export const KHOROOS: Khoroo[] = [
  {
    "id": "101-K1",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "101-K2",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "101-K3",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "101-K4",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "101-K5",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "101-K6",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "101-K7",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "101-K8",
    "district_id": "101",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "102-K1",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "102-K2",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "102-K3",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "102-K4",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "102-K5",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "102-K6",
    "district_id": "102",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "103-K1",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "103-K2",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "103-K3",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "103-K4",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "103-K5",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "103-K6",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "103-K7",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "103-K8",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "103-K9",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "9-р хороо",
    "sort_order": 9
  },
  {
    "id": "103-K10",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "10-р хороо",
    "sort_order": 10
  },
  {
    "id": "103-K11",
    "district_id": "103",
    "type": "khoroo",
    "name_mn": "11-р хороо",
    "sort_order": 11
  },
  {
    "id": "104-K1",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "104-K2",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "104-K3",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "104-K4",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "104-K5",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "104-K6",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "104-K7",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "104-K8",
    "district_id": "104",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "105-K1",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "105-K2",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "105-K3",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "105-K4",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "105-K5",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "105-K6",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "105-K7",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "105-K8",
    "district_id": "105",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "106-K1",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "106-K2",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "106-K3",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "106-K4",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "106-K5",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "106-K6",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "106-K7",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "106-K8",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "106-K9",
    "district_id": "106",
    "type": "khoroo",
    "name_mn": "9-р хороо",
    "sort_order": 9
  },
  {
    "id": "107-K1",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "107-K2",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "107-K3",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "107-K4",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "107-K5",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "107-K6",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "6-р хороо",
    "sort_order": 6
  },
  {
    "id": "107-K7",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "7-р хороо",
    "sort_order": 7
  },
  {
    "id": "107-K8",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "8-р хороо",
    "sort_order": 8
  },
  {
    "id": "107-K9",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "9-р хороо",
    "sort_order": 9
  },
  {
    "id": "107-K10",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "10-р хороо",
    "sort_order": 10
  },
  {
    "id": "107-K11",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "11-р хороо",
    "sort_order": 11
  },
  {
    "id": "107-K12",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "12-р хороо",
    "sort_order": 12
  },
  {
    "id": "107-K13",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "13-р хороо",
    "sort_order": 13
  },
  {
    "id": "107-K14",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "14-р хороо",
    "sort_order": 14
  },
  {
    "id": "107-K15",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "15-р хороо",
    "sort_order": 15
  },
  {
    "id": "107-K16",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "16-р хороо",
    "sort_order": 16
  },
  {
    "id": "107-K17",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "17-р хороо",
    "sort_order": 17
  },
  {
    "id": "107-K18",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "18-р хороо",
    "sort_order": 18
  },
  {
    "id": "107-K19",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "19-р хороо",
    "sort_order": 19
  },
  {
    "id": "107-K20",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "20-р хороо",
    "sort_order": 20
  },
  {
    "id": "107-K21",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "21-р хороо",
    "sort_order": 21
  },
  {
    "id": "107-K22",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "22-р хороо",
    "sort_order": 22
  },
  {
    "id": "107-K23",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "23-р хороо",
    "sort_order": 23
  },
  {
    "id": "107-K24",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "24-р хороо",
    "sort_order": 24
  },
  {
    "id": "107-K25",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "25-р хороо",
    "sort_order": 25
  },
  {
    "id": "107-K26",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "26-р хороо",
    "sort_order": 26
  },
  {
    "id": "107-K27",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "27-р хороо",
    "sort_order": 27
  },
  {
    "id": "107-K28",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "28-р хороо",
    "sort_order": 28
  },
  {
    "id": "107-K29",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "29-р хороо",
    "sort_order": 29
  },
  {
    "id": "107-K30",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "30-р хороо",
    "sort_order": 30
  },
  {
    "id": "107-K31",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "31-р хороо",
    "sort_order": 31
  },
  {
    "id": "107-K32",
    "district_id": "107",
    "type": "khoroo",
    "name_mn": "32-р хороо",
    "sort_order": 32
  },
  {
    "id": "108-K1",
    "district_id": "108",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "108-K2",
    "district_id": "108",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "108-K3",
    "district_id": "108",
    "type": "khoroo",
    "name_mn": "3-р хороо",
    "sort_order": 3
  },
  {
    "id": "108-K4",
    "district_id": "108",
    "type": "khoroo",
    "name_mn": "4-р хороо",
    "sort_order": 4
  },
  {
    "id": "108-K5",
    "district_id": "108",
    "type": "khoroo",
    "name_mn": "5-р хороо",
    "sort_order": 5
  },
  {
    "id": "109-K1",
    "district_id": "109",
    "type": "khoroo",
    "name_mn": "1-р хороо",
    "sort_order": 1
  },
  {
    "id": "109-K2",
    "district_id": "109",
    "type": "khoroo",
    "name_mn": "2-р хороо",
    "sort_order": 2
  },
  {
    "id": "MN4804-B1",
    "district_id": "MN4804",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4804-B2",
    "district_id": "MN4804",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4804-B3",
    "district_id": "MN4804",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4804-B4",
    "district_id": "MN4804",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4404-B1",
    "district_id": "MN4404",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4404-B2",
    "district_id": "MN4404",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4404-B3",
    "district_id": "MN4404",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4404-B4",
    "district_id": "MN4404",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6704-B1",
    "district_id": "MN6704",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6704-B2",
    "district_id": "MN6704",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6704-B3",
    "district_id": "MN6704",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6704-B4",
    "district_id": "MN6704",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8104-B1",
    "district_id": "MN8104",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8104-B2",
    "district_id": "MN8104",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8104-B3",
    "district_id": "MN8104",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8104-B4",
    "district_id": "MN8104",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8204-B1",
    "district_id": "MN8204",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8204-B2",
    "district_id": "MN8204",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8204-B3",
    "district_id": "MN8204",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8204-B4",
    "district_id": "MN8204",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8304-B1",
    "district_id": "MN8304",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8304-B2",
    "district_id": "MN8304",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8304-B3",
    "district_id": "MN8304",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8304-B4",
    "district_id": "MN8304",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8404-B1",
    "district_id": "MN8404",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8404-B2",
    "district_id": "MN8404",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8404-B3",
    "district_id": "MN8404",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8404-B4",
    "district_id": "MN8404",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4104-B1",
    "district_id": "MN4104",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4104-B2",
    "district_id": "MN4104",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4104-B3",
    "district_id": "MN4104",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4104-B4",
    "district_id": "MN4104",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4304-B1",
    "district_id": "MN4304",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4304-B2",
    "district_id": "MN4304",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4304-B3",
    "district_id": "MN4304",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4304-B4",
    "district_id": "MN4304",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8307-B1",
    "district_id": "MN8307",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8307-B2",
    "district_id": "MN8307",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8307-B3",
    "district_id": "MN8307",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8307-B4",
    "district_id": "MN8307",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4407-B1",
    "district_id": "MN4407",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4407-B2",
    "district_id": "MN4407",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4407-B3",
    "district_id": "MN4407",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4407-B4",
    "district_id": "MN4407",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6707-B1",
    "district_id": "MN6707",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6707-B2",
    "district_id": "MN6707",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6707-B3",
    "district_id": "MN6707",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6707-B4",
    "district_id": "MN6707",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4107-B1",
    "district_id": "MN4107",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4107-B2",
    "district_id": "MN4107",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4107-B3",
    "district_id": "MN4107",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4107-B4",
    "district_id": "MN4107",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6201-B1",
    "district_id": "MN6201",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6201-B2",
    "district_id": "MN6201",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6201-B3",
    "district_id": "MN6201",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6201-B4",
    "district_id": "MN6201",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4110-B1",
    "district_id": "MN4110",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4110-B2",
    "district_id": "MN4110",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4110-B3",
    "district_id": "MN4110",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4110-B4",
    "district_id": "MN4110",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2204-B1",
    "district_id": "MN2204",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2204-B2",
    "district_id": "MN2204",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2204-B3",
    "district_id": "MN2204",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2204-B4",
    "district_id": "MN2204",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8107-B1",
    "district_id": "MN8107",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8107-B2",
    "district_id": "MN8107",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8107-B3",
    "district_id": "MN8107",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8107-B4",
    "district_id": "MN8107",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6404-B1",
    "district_id": "MN6404",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6404-B2",
    "district_id": "MN6404",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6404-B3",
    "district_id": "MN6404",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6404-B4",
    "district_id": "MN6404",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2201-B1",
    "district_id": "MN2201",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2201-B2",
    "district_id": "MN2201",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2201-B3",
    "district_id": "MN2201",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2201-B4",
    "district_id": "MN2201",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6204-B1",
    "district_id": "MN6204",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6204-B2",
    "district_id": "MN6204",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6204-B3",
    "district_id": "MN6204",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6204-B4",
    "district_id": "MN6204",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4307-B1",
    "district_id": "MN4307",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4307-B2",
    "district_id": "MN4307",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4307-B3",
    "district_id": "MN4307",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4307-B4",
    "district_id": "MN4307",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8504-B1",
    "district_id": "MN8504",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8504-B2",
    "district_id": "MN8504",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8504-B3",
    "district_id": "MN8504",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8504-B4",
    "district_id": "MN8504",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6207-B1",
    "district_id": "MN6207",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6207-B2",
    "district_id": "MN6207",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6207-B3",
    "district_id": "MN6207",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6207-B4",
    "district_id": "MN6207",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6504-B1",
    "district_id": "MN6504",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6504-B2",
    "district_id": "MN6504",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6504-B3",
    "district_id": "MN6504",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6504-B4",
    "district_id": "MN6504",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2304-B1",
    "district_id": "MN2304",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2304-B2",
    "district_id": "MN2304",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2304-B3",
    "district_id": "MN2304",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2304-B4",
    "district_id": "MN2304",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2307-B1",
    "district_id": "MN2307",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2307-B2",
    "district_id": "MN2307",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2307-B3",
    "district_id": "MN2307",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2307-B4",
    "district_id": "MN2307",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4113-B1",
    "district_id": "MN4113",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4113-B2",
    "district_id": "MN4113",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4113-B3",
    "district_id": "MN4113",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4113-B4",
    "district_id": "MN4113",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4116-B1",
    "district_id": "MN4116",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4116-B2",
    "district_id": "MN4116",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4116-B3",
    "district_id": "MN4116",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4116-B4",
    "district_id": "MN4116",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2310-B1",
    "district_id": "MN2310",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2310-B2",
    "district_id": "MN2310",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2310-B3",
    "district_id": "MN2310",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2310-B4",
    "district_id": "MN2310",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6101-B1",
    "district_id": "MN6101",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6101-B2",
    "district_id": "MN6101",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6101-B3",
    "district_id": "MN6101",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6101-B4",
    "district_id": "MN6101",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6213-B1",
    "district_id": "MN6213",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6213-B2",
    "district_id": "MN6213",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6213-B3",
    "district_id": "MN6213",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6213-B4",
    "district_id": "MN6213",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6419-B1",
    "district_id": "MN6419",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6419-B2",
    "district_id": "MN6419",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6419-B3",
    "district_id": "MN6419",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6419-B4",
    "district_id": "MN6419",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4125-B1",
    "district_id": "MN4125",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4125-B2",
    "district_id": "MN4125",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4125-B3",
    "district_id": "MN4125",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4125-B4",
    "district_id": "MN4125",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2316-B1",
    "district_id": "MN2316",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2316-B2",
    "district_id": "MN2316",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2316-B3",
    "district_id": "MN2316",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2316-B4",
    "district_id": "MN2316",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4607-B1",
    "district_id": "MN4607",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4607-B2",
    "district_id": "MN4607",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4607-B3",
    "district_id": "MN4607",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4607-B4",
    "district_id": "MN4607",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6416-B1",
    "district_id": "MN6416",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6416-B2",
    "district_id": "MN6416",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6416-B3",
    "district_id": "MN6416",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6416-B4",
    "district_id": "MN6416",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2110-B1",
    "district_id": "MN2110",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2110-B2",
    "district_id": "MN2110",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2110-B3",
    "district_id": "MN2110",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2110-B4",
    "district_id": "MN2110",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8207-B1",
    "district_id": "MN8207",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8207-B2",
    "district_id": "MN8207",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8207-B3",
    "district_id": "MN8207",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8207-B4",
    "district_id": "MN8207",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6304-B1",
    "district_id": "MN6304",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6304-B2",
    "district_id": "MN6304",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6304-B3",
    "district_id": "MN6304",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6304-B4",
    "district_id": "MN6304",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6407-B1",
    "district_id": "MN6407",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6407-B2",
    "district_id": "MN6407",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6407-B3",
    "district_id": "MN6407",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6407-B4",
    "district_id": "MN6407",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4131-B1",
    "district_id": "MN4131",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4131-B2",
    "district_id": "MN4131",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4131-B3",
    "district_id": "MN4131",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4131-B4",
    "district_id": "MN4131",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6422-B1",
    "district_id": "MN6422",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6422-B2",
    "district_id": "MN6422",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6422-B3",
    "district_id": "MN6422",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6422-B4",
    "district_id": "MN6422",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4137-B1",
    "district_id": "MN4137",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4137-B2",
    "district_id": "MN4137",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4137-B3",
    "district_id": "MN4137",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4137-B4",
    "district_id": "MN4137",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4134-B1",
    "district_id": "MN4134",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4134-B2",
    "district_id": "MN4134",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4134-B3",
    "district_id": "MN4134",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4134-B4",
    "district_id": "MN4134",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4604-B1",
    "district_id": "MN4604",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4604-B2",
    "district_id": "MN4604",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4604-B3",
    "district_id": "MN4604",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4604-B4",
    "district_id": "MN4604",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2207-B1",
    "district_id": "MN2207",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2207-B2",
    "district_id": "MN2207",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2207-B3",
    "district_id": "MN2207",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2207-B4",
    "district_id": "MN2207",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4119-B1",
    "district_id": "MN4119",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4119-B2",
    "district_id": "MN4119",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4119-B3",
    "district_id": "MN4119",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4119-B4",
    "district_id": "MN4119",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2104-B1",
    "district_id": "MN2104",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2104-B2",
    "district_id": "MN2104",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2104-B3",
    "district_id": "MN2104",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2104-B4",
    "district_id": "MN2104",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4310-B1",
    "district_id": "MN4310",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4310-B2",
    "district_id": "MN4310",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4310-B3",
    "district_id": "MN4310",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4310-B4",
    "district_id": "MN4310",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6210-B1",
    "district_id": "MN6210",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6210-B2",
    "district_id": "MN6210",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6210-B3",
    "district_id": "MN6210",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6210-B4",
    "district_id": "MN6210",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6410-B1",
    "district_id": "MN6410",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6410-B2",
    "district_id": "MN6410",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6410-B3",
    "district_id": "MN6410",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6410-B4",
    "district_id": "MN6410",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4122-B1",
    "district_id": "MN4122",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4122-B2",
    "district_id": "MN4122",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4122-B3",
    "district_id": "MN4122",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4122-B4",
    "district_id": "MN4122",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4807-B1",
    "district_id": "MN4807",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4807-B2",
    "district_id": "MN4807",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4807-B3",
    "district_id": "MN4807",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4807-B4",
    "district_id": "MN4807",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6413-B1",
    "district_id": "MN6413",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6413-B2",
    "district_id": "MN6413",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6413-B3",
    "district_id": "MN6413",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6413-B4",
    "district_id": "MN6413",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2313-B1",
    "district_id": "MN2313",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2313-B2",
    "district_id": "MN2313",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2313-B3",
    "district_id": "MN2313",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2313-B4",
    "district_id": "MN2313",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6307-B1",
    "district_id": "MN6307",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6307-B2",
    "district_id": "MN6307",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6307-B3",
    "district_id": "MN6307",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6307-B4",
    "district_id": "MN6307",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8310-B1",
    "district_id": "MN8310",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8310-B2",
    "district_id": "MN8310",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8310-B3",
    "district_id": "MN8310",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8310-B4",
    "district_id": "MN8310",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4204-B1",
    "district_id": "MN4204",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4204-B2",
    "district_id": "MN4204",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4204-B3",
    "district_id": "MN4204",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4204-B4",
    "district_id": "MN4204",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8110-B1",
    "district_id": "MN8110",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8110-B2",
    "district_id": "MN8110",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8110-B3",
    "district_id": "MN8110",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8110-B4",
    "district_id": "MN8110",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2107-B1",
    "district_id": "MN2107",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2107-B2",
    "district_id": "MN2107",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2107-B3",
    "district_id": "MN2107",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2107-B4",
    "district_id": "MN2107",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8113-B1",
    "district_id": "MN8113",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8113-B2",
    "district_id": "MN8113",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8113-B3",
    "district_id": "MN8113",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8113-B4",
    "district_id": "MN8113",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4128-B1",
    "district_id": "MN4128",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4128-B2",
    "district_id": "MN4128",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4128-B3",
    "district_id": "MN4128",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4128-B4",
    "district_id": "MN4128",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6401-B1",
    "district_id": "MN6401",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6401-B2",
    "district_id": "MN6401",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6401-B3",
    "district_id": "MN6401",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6401-B4",
    "district_id": "MN6401",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2319-B1",
    "district_id": "MN2319",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2319-B2",
    "district_id": "MN2319",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2319-B3",
    "district_id": "MN2319",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2319-B4",
    "district_id": "MN2319",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6710-B1",
    "district_id": "MN6710",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6710-B2",
    "district_id": "MN6710",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6710-B3",
    "district_id": "MN6710",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6710-B4",
    "district_id": "MN6710",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8210-B1",
    "district_id": "MN8210",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8210-B2",
    "district_id": "MN8210",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8210-B3",
    "district_id": "MN8210",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8210-B4",
    "district_id": "MN8210",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2322-B1",
    "district_id": "MN2322",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2322-B2",
    "district_id": "MN2322",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2322-B3",
    "district_id": "MN2322",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2322-B4",
    "district_id": "MN2322",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6428-B1",
    "district_id": "MN6428",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6428-B2",
    "district_id": "MN6428",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6428-B3",
    "district_id": "MN6428",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6428-B4",
    "district_id": "MN6428",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8507-B1",
    "district_id": "MN8507",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8507-B2",
    "district_id": "MN8507",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8507-B3",
    "district_id": "MN8507",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8507-B4",
    "district_id": "MN8507",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6216-B1",
    "district_id": "MN6216",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6216-B2",
    "district_id": "MN6216",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6216-B3",
    "district_id": "MN6216",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6216-B4",
    "district_id": "MN6216",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6425-B1",
    "district_id": "MN6425",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6425-B2",
    "district_id": "MN6425",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6425-B3",
    "district_id": "MN6425",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6425-B4",
    "district_id": "MN6425",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2352-B1",
    "district_id": "MN2352",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2352-B2",
    "district_id": "MN2352",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2352-B3",
    "district_id": "MN2352",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2352-B4",
    "district_id": "MN2352",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4140-B1",
    "district_id": "MN4140",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4140-B2",
    "district_id": "MN4140",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4140-B3",
    "district_id": "MN4140",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4140-B4",
    "district_id": "MN4140",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6219-B1",
    "district_id": "MN6219",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6219-B2",
    "district_id": "MN6219",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6219-B3",
    "district_id": "MN6219",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6219-B4",
    "district_id": "MN6219",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6313-B1",
    "district_id": "MN6313",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6313-B2",
    "district_id": "MN6313",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6313-B3",
    "district_id": "MN6313",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6313-B4",
    "district_id": "MN6313",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4143-B1",
    "district_id": "MN4143",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4143-B2",
    "district_id": "MN4143",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4143-B3",
    "district_id": "MN4143",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4143-B4",
    "district_id": "MN4143",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6713-B1",
    "district_id": "MN6713",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6713-B2",
    "district_id": "MN6713",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6713-B3",
    "district_id": "MN6713",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6713-B4",
    "district_id": "MN6713",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6310-B1",
    "district_id": "MN6310",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6310-B2",
    "district_id": "MN6310",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6310-B3",
    "district_id": "MN6310",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6310-B4",
    "district_id": "MN6310",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8213-B1",
    "district_id": "MN8213",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8213-B2",
    "district_id": "MN8213",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8213-B3",
    "district_id": "MN8213",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8213-B4",
    "district_id": "MN8213",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8313-B1",
    "district_id": "MN8313",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8313-B2",
    "district_id": "MN8313",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8313-B3",
    "district_id": "MN8313",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8313-B4",
    "district_id": "MN8313",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2113-B1",
    "district_id": "MN2113",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2113-B2",
    "district_id": "MN2113",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2113-B3",
    "district_id": "MN2113",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2113-B4",
    "district_id": "MN2113",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4610-B1",
    "district_id": "MN4610",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4610-B2",
    "district_id": "MN4610",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4610-B3",
    "district_id": "MN4610",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4610-B4",
    "district_id": "MN4610",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6301-B1",
    "district_id": "MN6301",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6301-B2",
    "district_id": "MN6301",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6301-B3",
    "district_id": "MN6301",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6301-B4",
    "district_id": "MN6301",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6507-B1",
    "district_id": "MN6507",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6507-B2",
    "district_id": "MN6507",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6507-B3",
    "district_id": "MN6507",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6507-B4",
    "district_id": "MN6507",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8316-B1",
    "district_id": "MN8316",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8316-B2",
    "district_id": "MN8316",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8316-B3",
    "district_id": "MN8316",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8316-B4",
    "district_id": "MN8316",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8407-B1",
    "district_id": "MN8407",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8407-B2",
    "district_id": "MN8407",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8407-B3",
    "district_id": "MN8407",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8407-B4",
    "district_id": "MN8407",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6431-B1",
    "district_id": "MN6431",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6431-B2",
    "district_id": "MN6431",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6431-B3",
    "district_id": "MN6431",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6431-B4",
    "district_id": "MN6431",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8319-B1",
    "district_id": "MN8319",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8319-B2",
    "district_id": "MN8319",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8319-B3",
    "district_id": "MN8319",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8319-B4",
    "district_id": "MN8319",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8410-B1",
    "district_id": "MN8410",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8410-B2",
    "district_id": "MN8410",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8410-B3",
    "district_id": "MN8410",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8410-B4",
    "district_id": "MN8410",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2134-B1",
    "district_id": "MN2134",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2134-B2",
    "district_id": "MN2134",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2134-B3",
    "district_id": "MN2134",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2134-B4",
    "district_id": "MN2134",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6755-B1",
    "district_id": "MN6755",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6755-B2",
    "district_id": "MN6755",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6755-B3",
    "district_id": "MN6755",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6755-B4",
    "district_id": "MN6755",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6752-B1",
    "district_id": "MN6752",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6752-B2",
    "district_id": "MN6752",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6752-B3",
    "district_id": "MN6752",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6752-B4",
    "district_id": "MN6752",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8158-B1",
    "district_id": "MN8158",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8158-B2",
    "district_id": "MN8158",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8158-B3",
    "district_id": "MN8158",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8158-B4",
    "district_id": "MN8158",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4840-B1",
    "district_id": "MN4840",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4840-B2",
    "district_id": "MN4840",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4840-B3",
    "district_id": "MN4840",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4840-B4",
    "district_id": "MN4840",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4346-B1",
    "district_id": "MN4346",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4346-B2",
    "district_id": "MN4346",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4346-B3",
    "district_id": "MN4346",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4346-B4",
    "district_id": "MN4346",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6749-B1",
    "district_id": "MN6749",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6749-B2",
    "district_id": "MN6749",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6749-B3",
    "district_id": "MN6749",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6749-B4",
    "district_id": "MN6749",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8155-B1",
    "district_id": "MN8155",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8155-B2",
    "district_id": "MN8155",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8155-B3",
    "district_id": "MN8155",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8155-B4",
    "district_id": "MN8155",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8555-B1",
    "district_id": "MN8555",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8555-B2",
    "district_id": "MN8555",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8555-B3",
    "district_id": "MN8555",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8555-B4",
    "district_id": "MN8555",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6543-B1",
    "district_id": "MN6543",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6543-B2",
    "district_id": "MN6543",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6543-B3",
    "district_id": "MN6543",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6543-B4",
    "district_id": "MN6543",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8443-B1",
    "district_id": "MN8443",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8443-B2",
    "district_id": "MN8443",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8443-B3",
    "district_id": "MN8443",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8443-B4",
    "district_id": "MN8443",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8161-B1",
    "district_id": "MN8161",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8161-B2",
    "district_id": "MN8161",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8161-B3",
    "district_id": "MN8161",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8161-B4",
    "district_id": "MN8161",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6549-B1",
    "district_id": "MN6549",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6549-B2",
    "district_id": "MN6549",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6549-B3",
    "district_id": "MN6549",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6549-B4",
    "district_id": "MN6549",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6758-B1",
    "district_id": "MN6758",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6758-B2",
    "district_id": "MN6758",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6758-B3",
    "district_id": "MN6758",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6758-B4",
    "district_id": "MN6758",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4173-B1",
    "district_id": "MN4173",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4173-B2",
    "district_id": "MN4173",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4173-B3",
    "district_id": "MN4173",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4173-B4",
    "district_id": "MN4173",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8243-B1",
    "district_id": "MN8243",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8243-B2",
    "district_id": "MN8243",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8243-B3",
    "district_id": "MN8243",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8243-B4",
    "district_id": "MN8243",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8340-B1",
    "district_id": "MN8340",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8340-B2",
    "district_id": "MN8340",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8340-B3",
    "district_id": "MN8340",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8340-B4",
    "district_id": "MN8340",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6546-B1",
    "district_id": "MN6546",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6546-B2",
    "district_id": "MN6546",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6546-B3",
    "district_id": "MN6546",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6546-B4",
    "district_id": "MN6546",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2349-B1",
    "district_id": "MN2349",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2349-B2",
    "district_id": "MN2349",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2349-B3",
    "district_id": "MN2349",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2349-B4",
    "district_id": "MN2349",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8246-B1",
    "district_id": "MN8246",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8246-B2",
    "district_id": "MN8246",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8246-B3",
    "district_id": "MN8246",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8246-B4",
    "district_id": "MN8246",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8446-B1",
    "district_id": "MN8446",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8446-B2",
    "district_id": "MN8446",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8446-B3",
    "district_id": "MN8446",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8446-B4",
    "district_id": "MN8446",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6761-B1",
    "district_id": "MN6761",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6761-B2",
    "district_id": "MN6761",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6761-B3",
    "district_id": "MN6761",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6761-B4",
    "district_id": "MN6761",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2137-B1",
    "district_id": "MN2137",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2137-B2",
    "district_id": "MN2137",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2137-B3",
    "district_id": "MN2137",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2137-B4",
    "district_id": "MN2137",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2140-B1",
    "district_id": "MN2140",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2140-B2",
    "district_id": "MN2140",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2140-B3",
    "district_id": "MN2140",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2140-B4",
    "district_id": "MN2140",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6552-B1",
    "district_id": "MN6552",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6552-B2",
    "district_id": "MN6552",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6552-B3",
    "district_id": "MN6552",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6552-B4",
    "district_id": "MN6552",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8240-B1",
    "district_id": "MN8240",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8240-B2",
    "district_id": "MN8240",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8240-B3",
    "district_id": "MN8240",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8240-B4",
    "district_id": "MN8240",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4643-B1",
    "district_id": "MN4643",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4643-B2",
    "district_id": "MN4643",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4643-B3",
    "district_id": "MN4643",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4643-B4",
    "district_id": "MN4643",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4640-B1",
    "district_id": "MN4640",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4640-B2",
    "district_id": "MN4640",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4640-B3",
    "district_id": "MN4640",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4640-B4",
    "district_id": "MN4640",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2328-B1",
    "district_id": "MN2328",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2328-B2",
    "district_id": "MN2328",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2328-B3",
    "district_id": "MN2328",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2328-B4",
    "district_id": "MN2328",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4410-B1",
    "district_id": "MN4410",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4410-B2",
    "district_id": "MN4410",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4410-B3",
    "district_id": "MN4410",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4410-B4",
    "district_id": "MN4410",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4601-B1",
    "district_id": "MN4601",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4601-B2",
    "district_id": "MN4601",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4601-B3",
    "district_id": "MN4601",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4601-B4",
    "district_id": "MN4601",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2210-B1",
    "district_id": "MN2210",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2210-B2",
    "district_id": "MN2210",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2210-B3",
    "district_id": "MN2210",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2210-B4",
    "district_id": "MN2210",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8413-B1",
    "district_id": "MN8413",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8413-B2",
    "district_id": "MN8413",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8413-B3",
    "district_id": "MN8413",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8413-B4",
    "district_id": "MN8413",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8216-B1",
    "district_id": "MN8216",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8216-B2",
    "district_id": "MN8216",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8216-B3",
    "district_id": "MN8216",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8216-B4",
    "district_id": "MN8216",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2331-B1",
    "district_id": "MN2331",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2331-B2",
    "district_id": "MN2331",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2331-B3",
    "district_id": "MN2331",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2331-B4",
    "district_id": "MN2331",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4501-B1",
    "district_id": "MN4501",
    "type": "bag",
    "name_mn": "Зүүн-Уул баг",
    "sort_order": 1
  },
  {
    "id": "MN4501-B2",
    "district_id": "MN4501",
    "type": "bag",
    "name_mn": "Хойд баг",
    "sort_order": 2
  },
  {
    "id": "MN4501-B3",
    "district_id": "MN4501",
    "type": "bag",
    "name_mn": "Өмнөд баг",
    "sort_order": 3
  },
  {
    "id": "MN4501-B4",
    "district_id": "MN4501",
    "type": "bag",
    "name_mn": "Орхон баг",
    "sort_order": 4
  },
  {
    "id": "MN2119-B1",
    "district_id": "MN2119",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2119-B2",
    "district_id": "MN2119",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2119-B3",
    "district_id": "MN2119",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2119-B4",
    "district_id": "MN2119",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6319-B1",
    "district_id": "MN6319",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6319-B2",
    "district_id": "MN6319",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6319-B3",
    "district_id": "MN6319",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6319-B4",
    "district_id": "MN6319",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8510-B1",
    "district_id": "MN8510",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8510-B2",
    "district_id": "MN8510",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8510-B3",
    "district_id": "MN8510",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8510-B4",
    "district_id": "MN8510",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8219-B1",
    "district_id": "MN8219",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8219-B2",
    "district_id": "MN8219",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8219-B3",
    "district_id": "MN8219",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8219-B4",
    "district_id": "MN8219",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4819-B1",
    "district_id": "MN4819",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4819-B2",
    "district_id": "MN4819",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4819-B3",
    "district_id": "MN4819",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4819-B4",
    "district_id": "MN4819",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4413-B1",
    "district_id": "MN4413",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4413-B2",
    "district_id": "MN4413",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4413-B3",
    "district_id": "MN4413",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4413-B4",
    "district_id": "MN4413",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2334-B1",
    "district_id": "MN2334",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2334-B2",
    "district_id": "MN2334",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2334-B3",
    "district_id": "MN2334",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2334-B4",
    "district_id": "MN2334",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4146-B1",
    "district_id": "MN4146",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4146-B2",
    "district_id": "MN4146",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4146-B3",
    "district_id": "MN4146",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4146-B4",
    "district_id": "MN4146",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4816-B1",
    "district_id": "MN4816",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4816-B2",
    "district_id": "MN4816",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4816-B3",
    "district_id": "MN4816",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4816-B4",
    "district_id": "MN4816",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8322-B1",
    "district_id": "MN8322",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8322-B2",
    "district_id": "MN8322",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8322-B3",
    "district_id": "MN8322",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8322-B4",
    "district_id": "MN8322",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4822-B1",
    "district_id": "MN4822",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4822-B2",
    "district_id": "MN4822",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4822-B3",
    "district_id": "MN4822",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4822-B4",
    "district_id": "MN4822",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8416-B1",
    "district_id": "MN8416",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8416-B2",
    "district_id": "MN8416",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8416-B3",
    "district_id": "MN8416",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8416-B4",
    "district_id": "MN8416",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8116-B1",
    "district_id": "MN8116",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8116-B2",
    "district_id": "MN8116",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8116-B3",
    "district_id": "MN8116",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8116-B4",
    "district_id": "MN8116",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8419-B1",
    "district_id": "MN8419",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8419-B2",
    "district_id": "MN8419",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8419-B3",
    "district_id": "MN8419",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8419-B4",
    "district_id": "MN8419",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4176-B1",
    "district_id": "MN4176",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4176-B2",
    "district_id": "MN4176",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4176-B3",
    "district_id": "MN4176",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4176-B4",
    "district_id": "MN4176",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4440-B1",
    "district_id": "MN4440",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4440-B2",
    "district_id": "MN4440",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4440-B3",
    "district_id": "MN4440",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4440-B4",
    "district_id": "MN4440",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8252-B1",
    "district_id": "MN8252",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8252-B2",
    "district_id": "MN8252",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8252-B3",
    "district_id": "MN8252",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8252-B4",
    "district_id": "MN8252",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8449-B1",
    "district_id": "MN8449",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8449-B2",
    "district_id": "MN8449",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8449-B3",
    "district_id": "MN8449",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8449-B4",
    "district_id": "MN8449",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6501-B1",
    "district_id": "MN6501",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6501-B2",
    "district_id": "MN6501",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6501-B3",
    "district_id": "MN6501",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6501-B4",
    "district_id": "MN6501",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6767-B1",
    "district_id": "MN6767",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6767-B2",
    "district_id": "MN6767",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6767-B3",
    "district_id": "MN6767",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6767-B4",
    "district_id": "MN6767",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2237-B1",
    "district_id": "MN2237",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2237-B2",
    "district_id": "MN2237",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2237-B3",
    "district_id": "MN2237",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2237-B4",
    "district_id": "MN2237",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6458-B1",
    "district_id": "MN6458",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6458-B2",
    "district_id": "MN6458",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6458-B3",
    "district_id": "MN6458",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6458-B4",
    "district_id": "MN6458",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4843-B1",
    "district_id": "MN4843",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4843-B2",
    "district_id": "MN4843",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4843-B3",
    "district_id": "MN4843",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4843-B4",
    "district_id": "MN4843",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6555-B1",
    "district_id": "MN6555",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6555-B2",
    "district_id": "MN6555",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6555-B3",
    "district_id": "MN6555",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6555-B4",
    "district_id": "MN6555",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4179-B1",
    "district_id": "MN4179",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4179-B2",
    "district_id": "MN4179",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4179-B3",
    "district_id": "MN4179",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4179-B4",
    "district_id": "MN4179",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8167-B1",
    "district_id": "MN8167",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8167-B2",
    "district_id": "MN8167",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8167-B3",
    "district_id": "MN8167",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8167-B4",
    "district_id": "MN8167",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2325-B1",
    "district_id": "MN2325",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2325-B2",
    "district_id": "MN2325",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2325-B3",
    "district_id": "MN2325",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2325-B4",
    "district_id": "MN2325",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6716-B1",
    "district_id": "MN6716",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6716-B2",
    "district_id": "MN6716",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6716-B3",
    "district_id": "MN6716",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6716-B4",
    "district_id": "MN6716",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6434-B1",
    "district_id": "MN6434",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6434-B2",
    "district_id": "MN6434",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6434-B3",
    "district_id": "MN6434",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6434-B4",
    "district_id": "MN6434",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4810-B1",
    "district_id": "MN4810",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4810-B2",
    "district_id": "MN4810",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4810-B3",
    "district_id": "MN4810",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4810-B4",
    "district_id": "MN4810",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6222-B1",
    "district_id": "MN6222",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6222-B2",
    "district_id": "MN6222",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6222-B3",
    "district_id": "MN6222",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6222-B4",
    "district_id": "MN6222",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6316-B1",
    "district_id": "MN6316",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6316-B2",
    "district_id": "MN6316",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6316-B3",
    "district_id": "MN6316",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6316-B4",
    "district_id": "MN6316",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6437-B1",
    "district_id": "MN6437",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6437-B2",
    "district_id": "MN6437",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6437-B3",
    "district_id": "MN6437",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6437-B4",
    "district_id": "MN6437",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4813-B1",
    "district_id": "MN4813",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4813-B2",
    "district_id": "MN4813",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4813-B3",
    "district_id": "MN4813",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4813-B4",
    "district_id": "MN4813",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4613-B1",
    "district_id": "MN4613",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4613-B2",
    "district_id": "MN4613",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4613-B3",
    "district_id": "MN4613",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4613-B4",
    "district_id": "MN4613",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2116-B1",
    "district_id": "MN2116",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2116-B2",
    "district_id": "MN2116",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2116-B3",
    "district_id": "MN2116",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2116-B4",
    "district_id": "MN2116",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2101-B1",
    "district_id": "MN2101",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2101-B2",
    "district_id": "MN2101",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2101-B3",
    "district_id": "MN2101",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2101-B4",
    "district_id": "MN2101",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8122-B1",
    "district_id": "MN8122",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8122-B2",
    "district_id": "MN8122",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8122-B3",
    "district_id": "MN8122",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8122-B4",
    "district_id": "MN8122",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6722-B1",
    "district_id": "MN6722",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6722-B2",
    "district_id": "MN6722",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6722-B3",
    "district_id": "MN6722",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6722-B4",
    "district_id": "MN6722",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8125-B1",
    "district_id": "MN8125",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8125-B2",
    "district_id": "MN8125",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8125-B3",
    "district_id": "MN8125",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8125-B4",
    "district_id": "MN8125",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4419-B1",
    "district_id": "MN4419",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4419-B2",
    "district_id": "MN4419",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4419-B3",
    "district_id": "MN4419",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4419-B4",
    "district_id": "MN4419",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6513-B1",
    "district_id": "MN6513",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6513-B2",
    "district_id": "MN6513",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6513-B3",
    "district_id": "MN6513",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6513-B4",
    "district_id": "MN6513",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8222-B1",
    "district_id": "MN8222",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8222-B2",
    "district_id": "MN8222",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8222-B3",
    "district_id": "MN8222",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8222-B4",
    "district_id": "MN8222",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4149-B1",
    "district_id": "MN4149",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4149-B2",
    "district_id": "MN4149",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4149-B3",
    "district_id": "MN4149",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4149-B4",
    "district_id": "MN4149",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6104-B1",
    "district_id": "MN6104",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6104-B2",
    "district_id": "MN6104",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6104-B3",
    "district_id": "MN6104",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6104-B4",
    "district_id": "MN6104",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6440-B1",
    "district_id": "MN6440",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6440-B2",
    "district_id": "MN6440",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6440-B3",
    "district_id": "MN6440",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6440-B4",
    "district_id": "MN6440",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6510-B1",
    "district_id": "MN6510",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6510-B2",
    "district_id": "MN6510",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6510-B3",
    "district_id": "MN6510",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6510-B4",
    "district_id": "MN6510",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6719-B1",
    "district_id": "MN6719",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6719-B2",
    "district_id": "MN6719",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6719-B3",
    "district_id": "MN6719",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6719-B4",
    "district_id": "MN6719",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8401-B1",
    "district_id": "MN8401",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8401-B2",
    "district_id": "MN8401",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8401-B3",
    "district_id": "MN8401",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8401-B4",
    "district_id": "MN8401",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2337-B1",
    "district_id": "MN2337",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2337-B2",
    "district_id": "MN2337",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2337-B3",
    "district_id": "MN2337",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2337-B4",
    "district_id": "MN2337",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4316-B1",
    "district_id": "MN4316",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4316-B2",
    "district_id": "MN4316",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4316-B3",
    "district_id": "MN4316",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4316-B4",
    "district_id": "MN4316",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6443-B1",
    "district_id": "MN6443",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6443-B2",
    "district_id": "MN6443",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6443-B3",
    "district_id": "MN6443",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6443-B4",
    "district_id": "MN6443",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4155-B1",
    "district_id": "MN4155",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4155-B2",
    "district_id": "MN4155",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4155-B3",
    "district_id": "MN4155",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4155-B4",
    "district_id": "MN4155",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4825-B1",
    "district_id": "MN4825",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4825-B2",
    "district_id": "MN4825",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4825-B3",
    "district_id": "MN4825",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4825-B4",
    "district_id": "MN4825",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8522-B1",
    "district_id": "MN8522",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8522-B2",
    "district_id": "MN8522",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8522-B3",
    "district_id": "MN8522",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8522-B4",
    "district_id": "MN8522",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4322-B1",
    "district_id": "MN4322",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4322-B2",
    "district_id": "MN4322",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4322-B3",
    "district_id": "MN4322",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4322-B4",
    "district_id": "MN4322",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4616-B1",
    "district_id": "MN4616",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4616-B2",
    "district_id": "MN4616",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4616-B3",
    "district_id": "MN4616",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4616-B4",
    "district_id": "MN4616",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4422-B1",
    "district_id": "MN4422",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4422-B2",
    "district_id": "MN4422",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4422-B3",
    "district_id": "MN4422",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4422-B4",
    "district_id": "MN4422",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4619-B1",
    "district_id": "MN4619",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4619-B2",
    "district_id": "MN4619",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4619-B3",
    "district_id": "MN4619",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4619-B4",
    "district_id": "MN4619",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8425-B1",
    "district_id": "MN8425",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8425-B2",
    "district_id": "MN8425",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8425-B3",
    "district_id": "MN8425",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8425-B4",
    "district_id": "MN8425",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2122-B1",
    "district_id": "MN2122",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2122-B2",
    "district_id": "MN2122",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2122-B3",
    "district_id": "MN2122",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2122-B4",
    "district_id": "MN2122",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4158-B1",
    "district_id": "MN4158",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4158-B2",
    "district_id": "MN4158",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4158-B3",
    "district_id": "MN4158",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4158-B4",
    "district_id": "MN4158",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2213-B1",
    "district_id": "MN2213",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2213-B2",
    "district_id": "MN2213",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2213-B3",
    "district_id": "MN2213",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2213-B4",
    "district_id": "MN2213",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8428-B1",
    "district_id": "MN8428",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8428-B2",
    "district_id": "MN8428",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8428-B3",
    "district_id": "MN8428",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8428-B4",
    "district_id": "MN8428",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2340-B1",
    "district_id": "MN2340",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2340-B2",
    "district_id": "MN2340",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2340-B3",
    "district_id": "MN2340",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2340-B4",
    "district_id": "MN2340",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6701-B1",
    "district_id": "MN6701",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6701-B2",
    "district_id": "MN6701",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6701-B3",
    "district_id": "MN6701",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6701-B4",
    "district_id": "MN6701",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8431-B1",
    "district_id": "MN8431",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8431-B2",
    "district_id": "MN8431",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8431-B3",
    "district_id": "MN8431",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8431-B4",
    "district_id": "MN8431",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6322-B1",
    "district_id": "MN6322",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6322-B2",
    "district_id": "MN6322",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6322-B3",
    "district_id": "MN6322",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6322-B4",
    "district_id": "MN6322",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8434-B1",
    "district_id": "MN8434",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8434-B2",
    "district_id": "MN8434",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8434-B3",
    "district_id": "MN8434",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8434-B4",
    "district_id": "MN8434",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2216-B1",
    "district_id": "MN2216",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2216-B2",
    "district_id": "MN2216",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2216-B3",
    "district_id": "MN2216",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2216-B4",
    "district_id": "MN2216",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8525-B1",
    "district_id": "MN8525",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8525-B2",
    "district_id": "MN8525",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8525-B3",
    "district_id": "MN8525",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8525-B4",
    "district_id": "MN8525",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6231-B1",
    "district_id": "MN6231",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6231-B2",
    "district_id": "MN6231",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6231-B3",
    "district_id": "MN6231",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6231-B4",
    "district_id": "MN6231",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8128-B1",
    "district_id": "MN8128",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8128-B2",
    "district_id": "MN8128",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8128-B3",
    "district_id": "MN8128",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8128-B4",
    "district_id": "MN8128",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8325-B1",
    "district_id": "MN8325",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8325-B2",
    "district_id": "MN8325",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8325-B3",
    "district_id": "MN8325",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8325-B4",
    "district_id": "MN8325",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4625-B1",
    "district_id": "MN4625",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4625-B2",
    "district_id": "MN4625",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4625-B3",
    "district_id": "MN4625",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4625-B4",
    "district_id": "MN4625",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2343-B1",
    "district_id": "MN2343",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2343-B2",
    "district_id": "MN2343",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2343-B3",
    "district_id": "MN2343",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2343-B4",
    "district_id": "MN2343",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4622-B1",
    "district_id": "MN4622",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4622-B2",
    "district_id": "MN4622",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4622-B3",
    "district_id": "MN4622",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4622-B4",
    "district_id": "MN4622",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6516-B1",
    "district_id": "MN6516",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6516-B2",
    "district_id": "MN6516",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6516-B3",
    "district_id": "MN6516",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6516-B4",
    "district_id": "MN6516",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8301-B1",
    "district_id": "MN8301",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8301-B2",
    "district_id": "MN8301",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8301-B3",
    "district_id": "MN8301",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8301-B4",
    "district_id": "MN8301",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8528-B1",
    "district_id": "MN8528",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8528-B2",
    "district_id": "MN8528",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8528-B3",
    "district_id": "MN8528",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8528-B4",
    "district_id": "MN8528",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4828-B1",
    "district_id": "MN4828",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4828-B2",
    "district_id": "MN4828",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4828-B3",
    "district_id": "MN4828",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4828-B4",
    "district_id": "MN4828",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6234-B1",
    "district_id": "MN6234",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6234-B2",
    "district_id": "MN6234",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6234-B3",
    "district_id": "MN6234",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6234-B4",
    "district_id": "MN6234",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6449-B1",
    "district_id": "MN6449",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6449-B2",
    "district_id": "MN6449",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6449-B3",
    "district_id": "MN6449",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6449-B4",
    "district_id": "MN6449",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6519-B1",
    "district_id": "MN6519",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6519-B2",
    "district_id": "MN6519",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6519-B3",
    "district_id": "MN6519",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6519-B4",
    "district_id": "MN6519",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2346-B1",
    "district_id": "MN2346",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2346-B2",
    "district_id": "MN2346",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2346-B3",
    "district_id": "MN2346",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2346-B4",
    "district_id": "MN2346",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8531-B1",
    "district_id": "MN8531",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8531-B2",
    "district_id": "MN8531",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8531-B3",
    "district_id": "MN8531",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8531-B4",
    "district_id": "MN8531",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6522-B1",
    "district_id": "MN6522",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6522-B2",
    "district_id": "MN6522",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6522-B3",
    "district_id": "MN6522",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6522-B4",
    "district_id": "MN6522",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4831-B1",
    "district_id": "MN4831",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4831-B2",
    "district_id": "MN4831",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4831-B3",
    "district_id": "MN4831",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4831-B4",
    "district_id": "MN4831",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4161-B1",
    "district_id": "MN4161",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4161-B2",
    "district_id": "MN4161",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4161-B3",
    "district_id": "MN4161",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4161-B4",
    "district_id": "MN4161",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8534-B1",
    "district_id": "MN8534",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8534-B2",
    "district_id": "MN8534",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8534-B3",
    "district_id": "MN8534",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8534-B4",
    "district_id": "MN8534",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4425-B1",
    "district_id": "MN4425",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4425-B2",
    "district_id": "MN4425",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4425-B3",
    "district_id": "MN4425",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4425-B4",
    "district_id": "MN4425",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2219-B1",
    "district_id": "MN2219",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2219-B2",
    "district_id": "MN2219",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2219-B3",
    "district_id": "MN2219",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2219-B4",
    "district_id": "MN2219",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4325-B1",
    "district_id": "MN4325",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4325-B2",
    "district_id": "MN4325",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4325-B3",
    "district_id": "MN4325",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4325-B4",
    "district_id": "MN4325",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4504-B1",
    "district_id": "MN4504",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4504-B2",
    "district_id": "MN4504",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4504-B3",
    "district_id": "MN4504",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4504-B4",
    "district_id": "MN4504",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6325-B1",
    "district_id": "MN6325",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6325-B2",
    "district_id": "MN6325",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6325-B3",
    "district_id": "MN6325",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6325-B4",
    "district_id": "MN6325",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4328-B1",
    "district_id": "MN4328",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4328-B2",
    "district_id": "MN4328",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4328-B3",
    "district_id": "MN4328",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4328-B4",
    "district_id": "MN4328",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8131-B1",
    "district_id": "MN8131",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8131-B2",
    "district_id": "MN8131",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8131-B3",
    "district_id": "MN8131",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8131-B4",
    "district_id": "MN8131",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6328-B1",
    "district_id": "MN6328",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6328-B2",
    "district_id": "MN6328",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6328-B3",
    "district_id": "MN6328",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6328-B4",
    "district_id": "MN6328",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6725-B1",
    "district_id": "MN6725",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6725-B2",
    "district_id": "MN6725",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6725-B3",
    "district_id": "MN6725",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6725-B4",
    "district_id": "MN6725",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6728-B1",
    "district_id": "MN6728",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6728-B2",
    "district_id": "MN6728",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6728-B3",
    "district_id": "MN6728",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6728-B4",
    "district_id": "MN6728",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8537-B1",
    "district_id": "MN8537",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8537-B2",
    "district_id": "MN8537",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8537-B3",
    "district_id": "MN8537",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8537-B4",
    "district_id": "MN8537",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8328-B1",
    "district_id": "MN8328",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8328-B2",
    "district_id": "MN8328",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8328-B3",
    "district_id": "MN8328",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8328-B4",
    "district_id": "MN8328",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4401-B1",
    "district_id": "MN4401",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4401-B2",
    "district_id": "MN4401",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4401-B3",
    "district_id": "MN4401",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4401-B4",
    "district_id": "MN4401",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4801-B1",
    "district_id": "MN4801",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4801-B2",
    "district_id": "MN4801",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4801-B3",
    "district_id": "MN4801",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4801-B4",
    "district_id": "MN4801",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4331-B1",
    "district_id": "MN4331",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4331-B2",
    "district_id": "MN4331",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4331-B3",
    "district_id": "MN4331",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4331-B4",
    "district_id": "MN4331",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6331-B1",
    "district_id": "MN6331",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6331-B2",
    "district_id": "MN6331",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6331-B3",
    "district_id": "MN6331",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6331-B4",
    "district_id": "MN6331",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4834-B1",
    "district_id": "MN4834",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4834-B2",
    "district_id": "MN4834",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4834-B3",
    "district_id": "MN4834",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4834-B4",
    "district_id": "MN4834",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4428-B1",
    "district_id": "MN4428",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4428-B2",
    "district_id": "MN4428",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4428-B3",
    "district_id": "MN4428",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4428-B4",
    "district_id": "MN4428",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4334-B1",
    "district_id": "MN4334",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4334-B2",
    "district_id": "MN4334",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4334-B3",
    "district_id": "MN4334",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4334-B4",
    "district_id": "MN4334",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6237-B1",
    "district_id": "MN6237",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6237-B2",
    "district_id": "MN6237",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6237-B3",
    "district_id": "MN6237",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6237-B4",
    "district_id": "MN6237",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8134-B1",
    "district_id": "MN8134",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8134-B2",
    "district_id": "MN8134",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8134-B3",
    "district_id": "MN8134",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8134-B4",
    "district_id": "MN8134",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6334-B1",
    "district_id": "MN6334",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6334-B2",
    "district_id": "MN6334",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6334-B3",
    "district_id": "MN6334",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6334-B4",
    "district_id": "MN6334",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2125-B1",
    "district_id": "MN2125",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2125-B2",
    "district_id": "MN2125",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2125-B3",
    "district_id": "MN2125",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2125-B4",
    "district_id": "MN2125",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4167-B1",
    "district_id": "MN4167",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4167-B2",
    "district_id": "MN4167",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4167-B3",
    "district_id": "MN4167",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4167-B4",
    "district_id": "MN4167",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4628-B1",
    "district_id": "MN4628",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4628-B2",
    "district_id": "MN4628",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4628-B3",
    "district_id": "MN4628",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4628-B4",
    "district_id": "MN4628",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4349-B1",
    "district_id": "MN4349",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4349-B2",
    "district_id": "MN4349",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4349-B3",
    "district_id": "MN4349",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4349-B4",
    "district_id": "MN4349",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8249-B1",
    "district_id": "MN8249",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8249-B2",
    "district_id": "MN8249",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8249-B3",
    "district_id": "MN8249",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8249-B4",
    "district_id": "MN8249",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4510-B1",
    "district_id": "MN4510",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4510-B2",
    "district_id": "MN4510",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4510-B3",
    "district_id": "MN4510",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4510-B4",
    "district_id": "MN4510",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8164-B1",
    "district_id": "MN8164",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8164-B2",
    "district_id": "MN8164",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8164-B3",
    "district_id": "MN8164",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8164-B4",
    "district_id": "MN8164",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6764-B1",
    "district_id": "MN6764",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6764-B2",
    "district_id": "MN6764",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6764-B3",
    "district_id": "MN6764",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6764-B4",
    "district_id": "MN6764",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6455-B1",
    "district_id": "MN6455",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6455-B2",
    "district_id": "MN6455",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6455-B3",
    "district_id": "MN6455",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6455-B4",
    "district_id": "MN6455",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4207-B1",
    "district_id": "MN4207",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4207-B2",
    "district_id": "MN4207",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4207-B3",
    "district_id": "MN4207",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4207-B4",
    "district_id": "MN4207",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8137-B1",
    "district_id": "MN8137",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8137-B2",
    "district_id": "MN8137",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8137-B3",
    "district_id": "MN8137",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8137-B4",
    "district_id": "MN8137",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4164-B1",
    "district_id": "MN4164",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4164-B2",
    "district_id": "MN4164",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4164-B3",
    "district_id": "MN4164",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4164-B4",
    "district_id": "MN4164",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4201-B1",
    "district_id": "MN4201",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4201-B2",
    "district_id": "MN4201",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4201-B3",
    "district_id": "MN4201",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4201-B4",
    "district_id": "MN4201",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2222-B1",
    "district_id": "MN2222",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2222-B2",
    "district_id": "MN2222",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2222-B3",
    "district_id": "MN2222",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2222-B4",
    "district_id": "MN2222",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4301-B1",
    "district_id": "MN4301",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4301-B2",
    "district_id": "MN4301",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4301-B3",
    "district_id": "MN4301",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4301-B4",
    "district_id": "MN4301",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8225-B1",
    "district_id": "MN8225",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8225-B2",
    "district_id": "MN8225",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8225-B3",
    "district_id": "MN8225",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8225-B4",
    "district_id": "MN8225",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6240-B1",
    "district_id": "MN6240",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6240-B2",
    "district_id": "MN6240",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6240-B3",
    "district_id": "MN6240",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6240-B4",
    "district_id": "MN6240",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6731-B1",
    "district_id": "MN6731",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6731-B2",
    "district_id": "MN6731",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6731-B3",
    "district_id": "MN6731",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6731-B4",
    "district_id": "MN6731",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8540-B1",
    "district_id": "MN8540",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8540-B2",
    "district_id": "MN8540",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8540-B3",
    "district_id": "MN8540",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8540-B4",
    "district_id": "MN8540",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6525-B1",
    "district_id": "MN6525",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6525-B2",
    "district_id": "MN6525",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6525-B3",
    "district_id": "MN6525",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6525-B4",
    "district_id": "MN6525",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8146-B1",
    "district_id": "MN8146",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8146-B2",
    "district_id": "MN8146",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8146-B3",
    "district_id": "MN8146",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8146-B4",
    "district_id": "MN8146",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8149-B1",
    "district_id": "MN8149",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8149-B2",
    "district_id": "MN8149",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8149-B3",
    "district_id": "MN8149",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8149-B4",
    "district_id": "MN8149",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8546-B1",
    "district_id": "MN8546",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8546-B2",
    "district_id": "MN8546",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8546-B3",
    "district_id": "MN8546",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8546-B4",
    "district_id": "MN8546",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6337-B1",
    "district_id": "MN6337",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6337-B2",
    "district_id": "MN6337",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6337-B3",
    "district_id": "MN6337",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6337-B4",
    "district_id": "MN6337",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6243-B1",
    "district_id": "MN6243",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6243-B2",
    "district_id": "MN6243",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6243-B3",
    "district_id": "MN6243",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6243-B4",
    "district_id": "MN6243",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8231-B1",
    "district_id": "MN8231",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8231-B2",
    "district_id": "MN8231",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8231-B3",
    "district_id": "MN8231",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8231-B4",
    "district_id": "MN8231",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6737-B1",
    "district_id": "MN6737",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6737-B2",
    "district_id": "MN6737",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6737-B3",
    "district_id": "MN6737",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6737-B4",
    "district_id": "MN6737",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6528-B1",
    "district_id": "MN6528",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6528-B2",
    "district_id": "MN6528",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6528-B3",
    "district_id": "MN6528",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6528-B4",
    "district_id": "MN6528",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8331-B1",
    "district_id": "MN8331",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8331-B2",
    "district_id": "MN8331",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8331-B3",
    "district_id": "MN8331",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8331-B4",
    "district_id": "MN8331",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8228-B1",
    "district_id": "MN8228",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8228-B2",
    "district_id": "MN8228",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8228-B3",
    "district_id": "MN8228",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8228-B4",
    "district_id": "MN8228",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6734-B1",
    "district_id": "MN6734",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6734-B2",
    "district_id": "MN6734",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6734-B3",
    "district_id": "MN6734",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6734-B4",
    "district_id": "MN6734",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8140-B1",
    "district_id": "MN8140",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8140-B2",
    "district_id": "MN8140",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8140-B3",
    "district_id": "MN8140",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8140-B4",
    "district_id": "MN8140",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8143-B1",
    "district_id": "MN8143",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8143-B2",
    "district_id": "MN8143",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8143-B3",
    "district_id": "MN8143",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8143-B4",
    "district_id": "MN8143",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2228-B1",
    "district_id": "MN2228",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2228-B2",
    "district_id": "MN2228",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2228-B3",
    "district_id": "MN2228",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2228-B4",
    "district_id": "MN2228",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6740-B1",
    "district_id": "MN6740",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6740-B2",
    "district_id": "MN6740",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6740-B3",
    "district_id": "MN6740",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6740-B4",
    "district_id": "MN6740",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8543-B1",
    "district_id": "MN8543",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8543-B2",
    "district_id": "MN8543",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8543-B3",
    "district_id": "MN8543",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8543-B4",
    "district_id": "MN8543",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4337-B1",
    "district_id": "MN4337",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4337-B2",
    "district_id": "MN4337",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4337-B3",
    "district_id": "MN4337",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4337-B4",
    "district_id": "MN4337",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2225-B1",
    "district_id": "MN2225",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2225-B2",
    "district_id": "MN2225",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2225-B3",
    "district_id": "MN2225",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2225-B4",
    "district_id": "MN2225",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8437-B1",
    "district_id": "MN8437",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8437-B2",
    "district_id": "MN8437",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8437-B3",
    "district_id": "MN8437",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8437-B4",
    "district_id": "MN8437",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4170-B1",
    "district_id": "MN4170",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4170-B2",
    "district_id": "MN4170",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4170-B3",
    "district_id": "MN4170",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4170-B4",
    "district_id": "MN4170",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6743-B1",
    "district_id": "MN6743",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6743-B2",
    "district_id": "MN6743",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6743-B3",
    "district_id": "MN6743",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6743-B4",
    "district_id": "MN6743",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4431-B1",
    "district_id": "MN4431",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4431-B2",
    "district_id": "MN4431",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4431-B3",
    "district_id": "MN4431",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4431-B4",
    "district_id": "MN4431",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8501-B1",
    "district_id": "MN8501",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8501-B2",
    "district_id": "MN8501",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8501-B3",
    "district_id": "MN8501",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8501-B4",
    "district_id": "MN8501",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8334-B1",
    "district_id": "MN8334",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8334-B2",
    "district_id": "MN8334",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8334-B3",
    "district_id": "MN8334",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8334-B4",
    "district_id": "MN8334",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8101-B1",
    "district_id": "MN8101",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8101-B2",
    "district_id": "MN8101",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8101-B3",
    "district_id": "MN8101",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8101-B4",
    "district_id": "MN8101",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8152-B1",
    "district_id": "MN8152",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8152-B2",
    "district_id": "MN8152",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8152-B3",
    "district_id": "MN8152",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8152-B4",
    "district_id": "MN8152",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2231-B1",
    "district_id": "MN2231",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2231-B2",
    "district_id": "MN2231",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2231-B3",
    "district_id": "MN2231",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2231-B4",
    "district_id": "MN2231",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6246-B1",
    "district_id": "MN6246",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6246-B2",
    "district_id": "MN6246",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6246-B3",
    "district_id": "MN6246",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6246-B4",
    "district_id": "MN6246",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6531-B1",
    "district_id": "MN6531",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6531-B2",
    "district_id": "MN6531",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6531-B3",
    "district_id": "MN6531",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6531-B4",
    "district_id": "MN6531",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6249-B1",
    "district_id": "MN6249",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6249-B2",
    "district_id": "MN6249",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6249-B3",
    "district_id": "MN6249",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6249-B4",
    "district_id": "MN6249",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8234-B1",
    "district_id": "MN8234",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8234-B2",
    "district_id": "MN8234",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8234-B3",
    "district_id": "MN8234",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8234-B4",
    "district_id": "MN8234",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2128-B1",
    "district_id": "MN2128",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2128-B2",
    "district_id": "MN2128",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2128-B3",
    "district_id": "MN2128",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2128-B4",
    "district_id": "MN2128",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2234-B1",
    "district_id": "MN2234",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2234-B2",
    "district_id": "MN2234",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2234-B3",
    "district_id": "MN2234",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2234-B4",
    "district_id": "MN2234",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4631-B1",
    "district_id": "MN4631",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4631-B2",
    "district_id": "MN4631",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4631-B3",
    "district_id": "MN4631",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4631-B4",
    "district_id": "MN4631",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6534-B1",
    "district_id": "MN6534",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6534-B2",
    "district_id": "MN6534",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6534-B3",
    "district_id": "MN6534",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6534-B4",
    "district_id": "MN6534",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6340-B1",
    "district_id": "MN6340",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6340-B2",
    "district_id": "MN6340",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6340-B3",
    "district_id": "MN6340",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6340-B4",
    "district_id": "MN6340",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6746-B1",
    "district_id": "MN6746",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6746-B2",
    "district_id": "MN6746",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6746-B3",
    "district_id": "MN6746",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6746-B4",
    "district_id": "MN6746",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4634-B1",
    "district_id": "MN4634",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4634-B2",
    "district_id": "MN4634",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4634-B3",
    "district_id": "MN4634",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4634-B4",
    "district_id": "MN4634",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6252-B1",
    "district_id": "MN6252",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6252-B2",
    "district_id": "MN6252",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6252-B3",
    "district_id": "MN6252",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6252-B4",
    "district_id": "MN6252",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6537-B1",
    "district_id": "MN6537",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6537-B2",
    "district_id": "MN6537",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6537-B3",
    "district_id": "MN6537",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6537-B4",
    "district_id": "MN6537",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4434-B1",
    "district_id": "MN4434",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4434-B2",
    "district_id": "MN4434",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4434-B3",
    "district_id": "MN4434",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4434-B4",
    "district_id": "MN4434",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2301-B1",
    "district_id": "MN2301",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2301-B2",
    "district_id": "MN2301",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2301-B3",
    "district_id": "MN2301",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2301-B4",
    "district_id": "MN2301",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6343-B1",
    "district_id": "MN6343",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6343-B2",
    "district_id": "MN6343",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6343-B3",
    "district_id": "MN6343",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6343-B4",
    "district_id": "MN6343",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN2131-B1",
    "district_id": "MN2131",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN2131-B2",
    "district_id": "MN2131",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN2131-B3",
    "district_id": "MN2131",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN2131-B4",
    "district_id": "MN2131",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4437-B1",
    "district_id": "MN4437",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4437-B2",
    "district_id": "MN4437",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4437-B3",
    "district_id": "MN4437",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4437-B4",
    "district_id": "MN4437",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8237-B1",
    "district_id": "MN8237",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8237-B2",
    "district_id": "MN8237",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8237-B3",
    "district_id": "MN8237",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8237-B4",
    "district_id": "MN8237",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4507-B1",
    "district_id": "MN4507",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4507-B2",
    "district_id": "MN4507",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4507-B3",
    "district_id": "MN4507",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4507-B4",
    "district_id": "MN4507",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6540-B1",
    "district_id": "MN6540",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6540-B2",
    "district_id": "MN6540",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6540-B3",
    "district_id": "MN6540",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6540-B4",
    "district_id": "MN6540",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8440-B1",
    "district_id": "MN8440",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8440-B2",
    "district_id": "MN8440",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8440-B3",
    "district_id": "MN8440",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8440-B4",
    "district_id": "MN8440",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8549-B1",
    "district_id": "MN8549",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8549-B2",
    "district_id": "MN8549",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8549-B3",
    "district_id": "MN8549",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8549-B4",
    "district_id": "MN8549",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4340-B1",
    "district_id": "MN4340",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4340-B2",
    "district_id": "MN4340",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4340-B3",
    "district_id": "MN4340",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4340-B4",
    "district_id": "MN4340",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6452-B1",
    "district_id": "MN6452",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6452-B2",
    "district_id": "MN6452",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6452-B3",
    "district_id": "MN6452",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6452-B4",
    "district_id": "MN6452",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4637-B1",
    "district_id": "MN4637",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4637-B2",
    "district_id": "MN4637",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4637-B3",
    "district_id": "MN4637",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4637-B4",
    "district_id": "MN4637",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6255-B1",
    "district_id": "MN6255",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6255-B2",
    "district_id": "MN6255",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6255-B3",
    "district_id": "MN6255",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6255-B4",
    "district_id": "MN6255",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4837-B1",
    "district_id": "MN4837",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4837-B2",
    "district_id": "MN4837",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4837-B3",
    "district_id": "MN4837",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4837-B4",
    "district_id": "MN4837",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4343-B1",
    "district_id": "MN4343",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4343-B2",
    "district_id": "MN4343",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4343-B3",
    "district_id": "MN4343",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4343-B4",
    "district_id": "MN4343",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6346-B1",
    "district_id": "MN6346",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6346-B2",
    "district_id": "MN6346",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6346-B3",
    "district_id": "MN6346",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6346-B4",
    "district_id": "MN6346",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8552-B1",
    "district_id": "MN8552",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8552-B2",
    "district_id": "MN8552",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8552-B3",
    "district_id": "MN8552",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8552-B4",
    "district_id": "MN8552",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8170-B1",
    "district_id": "MN8170",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8170-B2",
    "district_id": "MN8170",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8170-B3",
    "district_id": "MN8170",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8170-B4",
    "district_id": "MN8170",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4313-B1",
    "district_id": "MN4313",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4313-B2",
    "district_id": "MN4313",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4313-B3",
    "district_id": "MN4313",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4313-B4",
    "district_id": "MN4313",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8201-B1",
    "district_id": "MN8201",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8201-B2",
    "district_id": "MN8201",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8201-B3",
    "district_id": "MN8201",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8201-B4",
    "district_id": "MN8201",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6225-B1",
    "district_id": "MN6225",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6225-B2",
    "district_id": "MN6225",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6225-B3",
    "district_id": "MN6225",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6225-B4",
    "district_id": "MN6225",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4152-B1",
    "district_id": "MN4152",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4152-B2",
    "district_id": "MN4152",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4152-B3",
    "district_id": "MN4152",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4152-B4",
    "district_id": "MN4152",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6446-B1",
    "district_id": "MN6446",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6446-B2",
    "district_id": "MN6446",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6446-B3",
    "district_id": "MN6446",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6446-B4",
    "district_id": "MN6446",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4416-B1",
    "district_id": "MN4416",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4416-B2",
    "district_id": "MN4416",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4416-B3",
    "district_id": "MN4416",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4416-B4",
    "district_id": "MN4416",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8513-B1",
    "district_id": "MN8513",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8513-B2",
    "district_id": "MN8513",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8513-B3",
    "district_id": "MN8513",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8513-B4",
    "district_id": "MN8513",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8119-B1",
    "district_id": "MN8119",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8119-B2",
    "district_id": "MN8119",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8119-B3",
    "district_id": "MN8119",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8119-B4",
    "district_id": "MN8119",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8422-B1",
    "district_id": "MN8422",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8422-B2",
    "district_id": "MN8422",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8422-B3",
    "district_id": "MN8422",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8422-B4",
    "district_id": "MN8422",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN6228-B1",
    "district_id": "MN6228",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN6228-B2",
    "district_id": "MN6228",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN6228-B3",
    "district_id": "MN6228",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN6228-B4",
    "district_id": "MN6228",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4319-B1",
    "district_id": "MN4319",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4319-B2",
    "district_id": "MN4319",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4319-B3",
    "district_id": "MN4319",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4319-B4",
    "district_id": "MN4319",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8516-B1",
    "district_id": "MN8516",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8516-B2",
    "district_id": "MN8516",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8516-B3",
    "district_id": "MN8516",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8516-B4",
    "district_id": "MN8516",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN8519-B1",
    "district_id": "MN8519",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN8519-B2",
    "district_id": "MN8519",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN8519-B3",
    "district_id": "MN8519",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN8519-B4",
    "district_id": "MN8519",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  },
  {
    "id": "MN4101-B1",
    "district_id": "MN4101",
    "type": "bag",
    "name_mn": "1-р баг",
    "sort_order": 1
  },
  {
    "id": "MN4101-B2",
    "district_id": "MN4101",
    "type": "bag",
    "name_mn": "2-р баг",
    "sort_order": 2
  },
  {
    "id": "MN4101-B3",
    "district_id": "MN4101",
    "type": "bag",
    "name_mn": "3-р баг",
    "sort_order": 3
  },
  {
    "id": "MN4101-B4",
    "district_id": "MN4101",
    "type": "bag",
    "name_mn": "4-р баг",
    "sort_order": 4
  }
];
