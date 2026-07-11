import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const employee = pgTable('employee', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  email: text('email'),
  user: text('user').notNull().unique(), // We'll use 'user' as login/identifier
  position: text('position'),
  province: text('province'),
  area: text('area'),
  upline: text('upline'),
  password: text('password'),
  level: text('level'),
  group: text('group'),
});

export const channel = pgTable('channel', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  pic: text('pic'),
  category: text('category'),
  province: text('province'),
  area: text('area'),
});

export const working = pgTable('working', {
  id: serial('id').primaryKey(),
  timestamp: text('timestamp'),
  channel: text('channel'),
  nameChecker: text('name_checker'),
  lot: text('lot'),
  quantityKg: text('quantity_kg'),
  agingMonth: text('aging_month'),
  expDate: text('exp_date'),
  crops: text('crops'),
  condition: text('condition'),
  shippingDate: text('shipping_date'),
  pog: text('pog'),
  jan: text('jan'),
  feb: text('feb'),
  mar: text('mar'),
  apr: text('apr'),
  mei: text('mei'),
  jun: text('jun'),
  jul: text('jul'),
  ags: text('ags'),
  sep: text('sep'),
  okt: text('okt'),
  nov: text('nov'),
  des: text('des'),
  upd_jan: text('upd_jan'),
  upd_feb: text('upd_feb'),
  upd_mar: text('upd_mar'),
  upd_apr: text('upd_apr'),
  upd_mei: text('upd_mei'),
  upd_jun: text('upd_jun'),
  upd_jul: text('upd_jul'),
  upd_ags: text('upd_ags'),
  upd_sep: text('upd_sep'),
  upd_okt: text('upd_okt'),
  upd_nov: text('upd_nov'),
  upd_des: text('upd_des'),
});

export const dr = pgTable('dr', {
  id: serial('id').primaryKey(),
  lotNo: text('lot_no'),
  date: text('date'),
  qty: text('qty'),
  hybrid: text('hybrid'),
  crops: text('crops'),
});

export const hybrid = pgTable('hybrid', {
  id: serial('id').primaryKey(),
  material: text('material'),
  hybrid: text('hybrid'),
  crops: text('crops'),
});

export const access = pgTable('access', {
  id: serial('id').primaryKey(),
  position: text('position'),
  home: text('home'),
  partner: text('partner'),
  stock: text('stock'),
  pog: text('pog'),
  overview: text('overview'),
  temp: text('temp'),
  accessLevel: text('access'), // 'access' is a keyword, renaming to accessLevel
});
