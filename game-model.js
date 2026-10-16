// Browser-local preview model. No remote authentication or multiplayer is implied.
export const ACCOUNT_KEY='newlife.quest.v2.preview.accounts.v1';
export const GUEST_KEY='newlife.quest.v2.preview.guest.v1';
export const SESSION_KEY='newlife.quest.v2.preview.session.v1';
export const ITEMS=Object.freeze({
  sword:{name:'ดาบนักเดินทาง',kind:'weapon',price:180,image:'sword.webp',description:'อาวุธคู่ใจสำหรับการผจญภัยครั้งแรก'},
  potion:{name:'ยาฟื้นพลัง',kind:'consumable',price:35,image:'potion.webp',description:'ฟื้น HP 40 หน่วย ใช้ระหว่างต่อสู้ได้'},
  upgrade_stone:{name:'หินตีบวก',kind:'material',price:70,image:'upgrade_stone.webp',description:'ใช้พร้อมเหรียญเพื่ออัปเกรดดาบที่โรงตีเหล็ก'},
  pet_fox:{name:'จิ้งจอกคู่ใจ',kind:'pet',price:260,image:'pet_fox.webp',description:'สัตว์เลี้ยงตัวน้อยสำหรับติดตามนักผจญภัย'},
  outfit:{name:'ชุดนักเดินทาง',kind:'fashion',price:150,image:'outfit.webp',description:'เครื่องแต่งกายของนักผจญภัยหน้าใหม่'},
  wings:{name:'ปีกประกายฟ้า',kind:'fashion',price:320,image:'wings.webp',description:'ปีกสีฟ้าสำหรับแต่งตัวในเมือง'},
  fish:{name:'ปลาจากแม่น้ำ',kind:'material',price:0,image:'fish.webp',description:'ของที่ระลึกจากท่าเรือแม่น้ำ'}
});
export const LOCATIONS=Object.freeze([
  {id:'blacksmith',name:'โรงตีเหล็ก',x:16,y:38,w:18,description:'ตีบวกดาบให้แข็งแกร่งขึ้น ด้วยเหรียญและหินตีบวก'},
  {id:'auction-house',name:'ร้านประมูล',x:68,y:40,w:19,description:'เลือกซื้อสินค้าตัวอย่างจากแผงประมูล'},
  {id:'adventurer-guild',name:'กิลด์นักผจญภัย',x:49,y:48,w:23,description:'ศูนย์กลางเมือง รับภารกิจและเริ่มเส้นทางนักผจญภัย'},
  {id:'hall-of-fame',name:'หอเกียรติยศ',x:35,y:34,w:14,description:'ดูอันดับและแรงก์นักผจญภัย'},
  {id:'dungeon',name:'ดันเจี้ยน',x:89,y:32,w:14,description:'เตรียมอาวุธ แล้วทดลองต่อสู้กับสไลม์ตัวแรก'},
  {id:'market',name:'ตลาด',x:16,y:57,w:25,description:'ซื้ออาวุธ ยา สัตว์เลี้ยง เครื่องแต่งกาย และหินตีบวก'},
  {id:'academy',name:'สำนักศึกษา',x:15,y:82,w:22,description:'เลือกอาจารย์ NPC เพื่อเริ่มต้นบทเรียน'},
  {id:'hot-springs',name:'บ่อน้ำพุร้อน',x:86,y:68,w:24,description:'พักผ่อนแช่น้ำ รับ EXP เล็กน้อยระหว่างที่เปิดหน้านี้'},
  {id:'wedding-chapel',name:'โบสถ์วิวาห์',x:34,y:73,w:18,description:'แวะชมโบสถ์และลงชื่อในสมุดเยี่ยม'},
  {id:'river-harbor',name:'ท่าเรือแม่น้ำ',x:66,y:92,w:32,description:'นั่งตกปลาและเก็บของที่ระลึกจากแม่น้ำ'}
]);
export const TOOLBAR=[['profile','ตัวละคร'],['bag','กระเป๋า'],['quests','ภารกิจ'],['skills','สกิล'],['friends','เพื่อน'],['mail','จดหมาย'],['settings','ตั้งค่า']];
export const QUESTS=[{id:'welcome',name:'เริ่มเรื่องราวที่กิลด์',visit:'adventurer-guild',gold:100,xp:15},{id:'riverside',name:'เยี่ยมชมท่าเรือแม่น้ำ',visit:'river-harbor',gold:60,xp:10},{id:'rest',name:'แวะพักที่บ่อน้ำพุร้อน',visit:'hot-springs',gold:50,xp:10}];
export const DEFAULT_CHARACTER={name:'นักผจญภัยตัวน้อย',gender:'male'};
export function validateAccount(username,password,confirmation=password){
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(username)||['__proto__','constructor','prototype'].includes(username.toLowerCase()))return 'ชื่อบัญชีใช้ a–z ตัวเลข หรือ _ จำนวน 3–24 ตัว และไม่ใช่ชื่อสงวน';
  if(typeof password!=='string'||password.length<8||password.length>128)return 'รหัสผ่านต้องมี 8–128 ตัวอักษร';
  if(password!==confirmation)return 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';return '';
}
export function validateCharacter(name,gender){
  if(typeof name!=='string'||[...name.trim()].length<2||[...name.trim()].length>24||/[<>\x00-\x1f]/.test(name))return 'ชื่อตัวละครต้องมี 2–24 ตัวอักษร และไม่มี < หรือ >';
  if(!['male','female'].includes(gender))return 'เลือกเพศตัวละครก่อน';return '';
}
export function freshProfile(character){
  const error=validateCharacter(character.name,character.gender);if(error)throw new Error(error);
  return {name:character.name.trim(),gender:character.gender,gold:1200,gems:0,xp:0,hp:100,inventory:{sword:1,potion:3,outfit:1},equipped:{weapon:'sword',fashion:'outfit'},upgrade:0,visited:[],claimed:[],friends:[],chat:[],mentor:null};
}
const clone=value=>structuredClone(value);
export function readProfile(input){
  if(!input||validateCharacter(input.name,input.gender))return null;
  const profile=freshProfile(input);
  for(const key of ['gold','gems','xp','hp','upgrade'])if(Number.isFinite(input[key]))profile[key]=Math.max(0,Math.min(key==='hp'?100:key==='upgrade'?3:999999,Math.floor(input[key])));
  profile.inventory={};for(const id of Object.keys(ITEMS))if(Number.isInteger(input.inventory?.[id])&&input.inventory[id]>0)profile.inventory[id]=Math.min(999,input.inventory[id]);
  profile.equipped={};for(const [kind,id]of Object.entries(input.equipped||{}))if(ITEMS[id]?.kind===kind&&profile.inventory[id])profile.equipped[kind]=id;
  for(const key of ['visited','claimed','friends'])if(Array.isArray(input[key]))profile[key]=[...new Set(input[key].filter(x=>typeof x==='string'&&x.length<=50))].slice(0,100);
  profile.chat=Array.isArray(input.chat)?input.chat.filter(x=>x&&typeof x.text==='string').slice(-40).map(x=>({text:x.text.slice(0,160),name:String(x.name||profile.name).slice(0,24)})):[];
  profile.mentor=['อาจารย์อาเรีย','อาจารย์โรแวน'].includes(input.mentor)?input.mentor:null;
  return profile;
}
function add(p,id,quantity=1){p.inventory[id]=Math.min(999,(p.inventory[id]||0)+quantity);}
export function act(profile,action,payload,now=new Date()){
  const p=clone(profile);let message='บันทึกแล้ว';
  if(action==='visit'){if(!LOCATIONS.some(x=>x.id===payload))throw new Error('ไม่พบสถานที่');if(!p.visited.includes(payload))p.visited.push(payload);}
  else if(action==='buy'){
    const item=ITEMS[payload];if(!item?.price)throw new Error('สินค้านี้ยังไม่เปิดขาย');
    if((p.inventory[payload]||0)>=999)throw new Error('ช่องเก็บไอเท็มเต็มแล้ว');
    if(p.gold<item.price)throw new Error('เหรียญไม่พอ');p.gold-=item.price;add(p,payload);message=`ซื้อ${item.name}แล้ว`;
  }else if(action==='equip'){
    const item=ITEMS[payload];if(!item||!p.inventory[payload]||!['weapon','fashion','pet'].includes(item.kind))throw new Error('ไอเท็มนี้สวมใส่ไม่ได้');
    if(p.equipped[item.kind]===payload)delete p.equipped[item.kind];else p.equipped[item.kind]=payload;message='บันทึกอุปกรณ์แล้ว';
  }else if(action==='potion'){
    if(!p.inventory.potion)throw new Error('ไม่มียาฟื้นพลัง');if(p.hp>=100)throw new Error('พลังชีวิตเต็มแล้ว');p.inventory.potion--;p.hp=Math.min(100,p.hp+40);message='ฟื้นพลังชีวิตแล้ว';
  }else if(action==='upgrade'){
    if(!p.inventory.sword)throw new Error('ต้องมีดาบก่อน');if(p.upgrade>=3)throw new Error('ดาบถึงระดับสูงสุดของพรีวิวแล้ว');
    if(p.gold<50||!p.inventory.upgrade_stone)throw new Error('ต้องใช้ 50 เหรียญ และหินตีบวก 1 ก้อน');p.gold-=50;p.inventory.upgrade_stone--;p.upgrade++;message=`ดาบเพิ่มเป็น +${p.upgrade} แล้ว`;
  }else if(action==='quest'){
    const q=QUESTS.find(q=>q.id===payload);if(!q||!p.visited.includes(q.visit))throw new Error('ยังทำภารกิจไม่ครบ');if(p.claimed.includes('quest:'+q.id))throw new Error('รับรางวัลแล้ว');p.gold+=q.gold;p.xp+=q.xp;p.claimed.push('quest:'+q.id);message=`ได้รับ ${q.gold} เหรียญ และ ${q.xp} EXP`;
  }else if(action==='claim'){
    const key=payload==='daily'?'daily:'+now.toISOString().slice(0,10):payload;
    if(!['mail','coin','daily'].includes(payload))throw new Error('ไม่พบรางวัล');if(p.claimed.includes(key))throw new Error('รับรางวัลแล้ว');p.claimed.push(key);p.gold+=payload==='coin'?300:100;if(payload==='mail')add(p,'potion',2);message='รับรางวัลเข้ากระเป๋าแล้ว';
  }else if(action==='friend'){
    const name=String(payload).trim();if(validateCharacter(name,'male'))throw new Error('ชื่อเพื่อนต้องมี 2–24 ตัวอักษร');if(name===p.name)throw new Error('นี่คือชื่อของคุณ');if(p.friends.includes(name))throw new Error('มีชื่อนี้อยู่แล้ว');if(p.friends.length>=30)throw new Error('รายชื่อเต็มแล้ว');p.friends.push(name);message='เพิ่มลงรายชื่อในเครื่องนี้แล้ว';
  }else if(action==='unfriend'){p.friends=p.friends.filter(x=>x!==payload);message='นำชื่อออกจากรายการแล้ว';}
  else if(action==='mentor'){if(!['อาจารย์อาเรีย','อาจารย์โรแวน'].includes(payload))throw new Error('ไม่พบอาจารย์');p.mentor=payload;message='เลือกอาจารย์แล้ว';}
  else if(action==='guestbook'){if(p.claimed.includes('guestbook'))throw new Error('ลงชื่อไว้แล้ว');p.claimed.push('guestbook');message='ลงชื่อในสมุดเยี่ยมแล้ว';}
  else if(action==='rest'){p.xp++;p.hp=Math.min(100,p.hp+2);message='+1 EXP · พักผ่อนอีกนิดนะ';}
  else if(action==='fish'){add(p,'fish');p.xp+=2;message='ตกปลาได้แล้ว! +2 EXP';}
  else if(action==='damage'){p.hp=Math.max(0,p.hp-12);}
  else if(action==='victory'){p.xp+=30;p.gold+=60;message='ชนะสไลม์! +60 เหรียญ · +30 EXP';}
  else if(action==='revive'){if(p.hp>0)throw new Error('ยังมีพลังชีวิตอยู่');p.hp=100;message='พักฟื้นแล้ว พร้อมออกเดินทางอีกครั้ง';}
  else if(action==='chat'){const text=String(payload).trim();if(!text||text.length>160)throw new Error('ข้อความยาวไม่เกิน 160 ตัวอักษร');p.chat.push({name:p.name,text});p.chat=p.chat.slice(-40);message='บันทึกข้อความในเครื่องนี้แล้ว';}
  else throw new Error('ไม่พบคำสั่ง');
  return {profile:p,message};
}
const hex=bytes=>[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
async function passwordHash(password,salt,cryptoApi){
  const key=await cryptoApi.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await cryptoApi.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt.match(/../g).map(x=>parseInt(x,16))),iterations:150000,hash:'SHA-256'},key,256)));
}
export class PreviewVault{
  constructor(storage,sessionStorage,cryptoApi=globalThis.crypto){this.storage=storage;this.sessionStorage=sessionStorage;this.crypto=cryptoApi;this.current=null;this.profile=null;}
  accounts(){try{const a=JSON.parse(this.storage.getItem(ACCOUNT_KEY));return a&&typeof a==='object'&&!Array.isArray(a)?a:{};}catch{return {};}}
  write(key,value,store=this.storage){try{store.setItem(key,JSON.stringify(value));}catch{throw new Error('เบราว์เซอร์บันทึกข้อมูลไม่ได้ กรุณาอนุญาตพื้นที่จัดเก็บแล้วลองใหม่');}}
  exists(username){return Object.hasOwn(this.accounts(),username.toLowerCase());}
  async register(username,password,character){
    const error=validateAccount(username,password)||validateCharacter(character.name,character.gender);if(error)throw new Error(error);
    if(!this.crypto?.subtle)throw new Error('ต้องเปิดผ่าน HTTPS เพื่อสมัครบัญชีทดสอบ');
    const id=username.toLowerCase();if(this.exists(id))throw new Error('มีชื่อบัญชีนี้ในเครื่องแล้ว');
    const salt=hex(this.crypto.getRandomValues(new Uint8Array(16))),hash=await passwordHash(password,salt,this.crypto);
    const accounts=this.accounts();if(Object.hasOwn(accounts,id))throw new Error('มีชื่อบัญชีนี้ในเครื่องแล้ว');
    const profile=freshProfile(character);accounts[id]={username,salt,hash,profile};this.write(ACCOUNT_KEY,accounts);this.setSession(id,profile);return profile;
  }
  async login(username,password){
    const id=username.toLowerCase(),account=this.accounts()[id];
    if(!Object.hasOwn(this.accounts(),id)||!account||!/^[0-9a-f]{32}$/.test(account.salt)||!/^[0-9a-f]{64}$/.test(account.hash)||await passwordHash(password,account.salt,this.crypto)!==account.hash)throw new Error('ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้องในเครื่องนี้');
    const profile=readProfile(account.profile);if(!profile)throw new Error('ข้อมูลตัวละครอ่านไม่ได้');this.setSession(id,profile);return profile;
  }
  guest(character){const profile=freshProfile(character);this.write(GUEST_KEY,profile);this.setSession('@guest',profile);return profile;}
  savedGuest(){try{return readProfile(JSON.parse(this.storage.getItem(GUEST_KEY)));}catch{return null;}}
  resumeGuest(){const profile=this.savedGuest();if(!profile)return null;this.setSession('@guest',profile);return profile;}
  setSession(id,profile){this.write(SESSION_KEY,{id},this.sessionStorage);this.current=id;this.profile=profile;}
  restore(){
    try{const {id}=JSON.parse(this.sessionStorage.getItem(SESSION_KEY));const raw=id==='@guest'?JSON.parse(this.storage.getItem(GUEST_KEY)):Object.hasOwn(this.accounts(),id)?this.accounts()[id].profile:null;
      const profile=readProfile(raw);if(!profile)return null;this.current=id;return this.profile=profile;}catch{return null;}
  }
  save(profile){
    if(!this.current)throw new Error('เข้าสู่เกมก่อน');const valid=readProfile(profile);if(!valid)throw new Error('ข้อมูลตัวละครไม่ถูกต้อง');
    if(this.current==='@guest')this.write(GUEST_KEY,valid);else{const accounts=this.accounts();if(!Object.hasOwn(accounts,this.current))throw new Error('ไม่พบบัญชี');accounts[this.current].profile=valid;this.write(ACCOUNT_KEY,accounts);}
    this.profile=valid;return valid;
  }
  logout(){try{this.sessionStorage.removeItem(SESSION_KEY);}catch{}this.current=null;this.profile=null;}
}
