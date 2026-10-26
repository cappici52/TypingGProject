import type { Mode } from "./game";

export const GUARDIAN_WORDS: Record<Mode, string[]> = {
  en: ["guardian", "enchanted", "sentinel", "fortress", "sorcerer", "sanctuary", "moonlight", "spellbound", "battlement", "incantation", "resilience", "spellcaster"],
  th: ["ผู้พิทักษ์", "เวทมนตร์", "พงไพร", "โบราณ", "คริสตัล", "คำสาป", "อาณาจักร", "จอมเวท", "พลังวิเศษ", "แสงจันทร์", "ความกล้าหาญ", "นักเดินทาง"],
  javascript: ["Object.keys()", "Math.random()", "Array.filter()", "Promise.resolve", "JSON.stringify", "Object.assign()", "Array.isArray()", "setInterval()", "WeakMap", "Object.freeze()", "Number.isFinite", "Symbol.iterator"],
  python: ["isinstance()", "enumerate()", "list.append()", "str.format()", "__getitem__", "@staticmethod", "collections", "defaultdict", "__iter__", "functools", "frozenset", "@classmethod"],
};

export const SENTENCES: Record<Mode, string[]> = {
  en: [
    "The ancient forest protects its secrets.",
    "A brave knight never abandons the quest.",
    "Moonlight reveals the forgotten pathway.",
    "Raise your shield against the darkness.",
    "The dragon guards a legendary treasure.",
    "Every fallen kingdom leaves a story.",
    "Only courage can break the final curse.",
    "Beyond the ruins, a new adventure begins.",
    "The guardian awakens beneath the stars.",
    "Let your words become a mighty weapon.",
    "Through shadow and flame, we stand united.",
    "The last spell will restore the forest.",
  ],
  th: [
    "นักรบผู้กล้าปกป้องป่าแห่งมนตรา",
    "มังกรโบราณเฝ้าสมบัติในปราสาท",
    "แสงจันทร์นำทางผ่านป่าอันมืดมิด",
    "ยกโล่ขึ้นรับพลังแห่งความมืด",
    "ทุกถ้อยคำคือพลังแห่งความกล้าหาญ",
    "ผู้พิทักษ์ตื่นขึ้นใต้แสงดวงดาว",
    "ดาบในตำนานส่องประกายอีกครั้ง",
    "จงทำลายคำสาปแห่งอาณาจักรที่ถูกลืม",
    "หลังซากวิหารมีการผจญภัยครั้งใหม่",
    "สายลมกระซิบบอกความลับของพงไพร",
    "เวทมนตร์สุดท้ายจะฟื้นคืนผืนป่า",
    "ความหวังยังคงส่องแสงในหัวใจนักรบ",
  ],
  javascript: [
    "const shield = inventory.find(isShield);",
    "if (hero.hp > 0) attack(dragon);",
    "const damage = Math.floor(power * 1.5);",
    "await Promise.all(quests.map(finish));",
    "const alive = enemies.filter(e => e.hp > 0);",
    "return { ...hero, hp: hero.hp - 1 };",
    "const loot = new Map(Object.entries(bag));",
    "spells.forEach(spell => spell.cast());",
    "try { await saveGame(); } catch (error) {}",
    "const total = hits.reduce((a, b) => a + b, 0);",
    "document.addEventListener('keydown', attack);",
    "export const victory = boss.hp === 0;",
  ],
  python: [
    "damage = max(0, power - armor)",
    "if hero.hp > 0: attack(dragon)",
    "alive = [e for e in enemies if e.hp > 0]",
    "for spell in spells: spell.cast()",
    "def heal(hero): return hero.hp + 10",
    "treasure = sorted(items, key=lambda x: x.gold)",
    "assert boss.hp == 0, 'Keep fighting!'",
    "with open('save.json') as f: load(f)",
    "shield = next(item for item in bag if item.safe)",
    "async def quest(): await explore()",
    "loot = {item.name: item.gold for item in bag}",
    "return sum(hit.damage for hit in attacks)",
  ],
};

const subjects = ["The wandering knight", "The woodland ranger", "The silver archer", "The young apprentice", "The royal messenger", "The mountain guardian", "The village healer", "The traveling bard", "The ancient druid", "The fearless scout", "The loyal captain", "The last paladin"];
const endings = ["follows the river toward the old keep.", "searches for a rune beneath the ruins.", "carries a lantern through the mist.", "listens to the whispers of the forest.", "finds a hidden path beyond the bridge.", "returns to the village before dawn.", "protects the travelers from the storm.", "remembers the promise made at twilight.", "crosses the valley beneath the stars.", "waits beside the gates of the citadel."];
SENTENCES.en.push(...subjects.flatMap(subject => endings.map(ending => `${subject} ${ending}`)));
const thaiSubjects = ["อัศวินพเนจร", "นักธนูแห่งพงไพร", "ผู้พิทักษ์ภูเขา", "นักเวทฝึกหัด", "ผู้ส่งสารของราชา", "นักล่าผู้กล้าหาญ", "หมอสมุนไพร", "กวีผู้เดินทาง", "นักปราชญ์ชรา", "ทหารผู้ซื่อสัตย์", "นักสำรวจแดนไกล", "ผู้กล้าคนสุดท้าย"];
const thaiEndings = ["เดินตามลำธารไปยังปราการเก่า", "ค้นหาอักษรรูนใต้ซากวิหาร", "ถือตะเกียงฝ่าหมอกยามค่ำคืน", "ฟังเสียงกระซิบของผืนป่า", "ค้นพบเส้นทางลับหลังสะพาน", "กลับถึงหมู่บ้านก่อนแสงอรุณ", "ช่วยนักเดินทางให้พ้นจากพายุ", "จดจำคำสัญญาใต้แสงจันทร์", "ข้ามหุบเขาท่ามกลางดวงดาว", "รอคอยอยู่ข้างประตูปราสาท"];
SENTENCES.th.push(...thaiSubjects.flatMap(subject => thaiEndings.map(ending => subject + ending)));
const lists = ["items", "enemies", "spells", "quests", "players", "weapons", "potions", "runes", "rewards", "targets", "scores", "stages", "allies", "skills", "effects", "recipes"];
SENTENCES.javascript.push(...lists.flatMap(list => [
  `const count = ${list}.length;`, `const first = ${list}.at(0);`, `const copy = [...${list}];`,
  `const active = ${list}.filter(isActive);`, `const names = ${list}.map(x => x.name);`,
  `for (const entry of ${list}) inspect(entry);`, `const found = ${list}.find(isRare);`,
  `const total = ${list}.reduce((n, x) => n + x.value, 0);`,
]));
SENTENCES.python.push(...lists.flatMap(list => [
  `count = len(${list})`, `first = next(iter(${list}), None)`, `copy = list(${list})`,
  `active = [x for x in ${list} if x.active]`, `names = [x.name for x in ${list}]`,
  `for entry in ${list}: inspect(entry)`, `ordered = sorted(${list}, key=lambda x: x.name)`,
  `total = sum(x.value for x in ${list})`,
]));
// Minibosses draw from a broader advanced bank, without changing normal-stage difficulty.
import { WORDS } from "./words";
for (const mode of ["en", "th", "javascript", "python"] as const) {
  GUARDIAN_WORDS[mode] = [...new Set([...GUARDIAN_WORDS[mode], ...WORDS[mode][2]])];
  SENTENCES[mode] = [...new Set(SENTENCES[mode])];
}
