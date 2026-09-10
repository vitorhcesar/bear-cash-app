import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('assets/images/settings');
const iconsDir = path.join(root, 'icons');
const banksDir = path.join(root, 'banks');

function clean(svg, clipId) {
  let xml = svg
    .replace(/\r\n/g, '\n')
    .replace(/ preserveAspectRatio="none"/g, '')
    .replace(/ style="display: block;"/g, '')
    .trim();

  if (clipId) {
    xml = xml.replace(/clip0_[0-9_]+/g, clipId);
  }

  return xml;
}

function toTs(name, xml) {
  return `export const ${name} =\n  ${JSON.stringify(xml)};\n`;
}

const markRaw = clean(
  fs.readFileSync(path.join(iconsDir, 'profile-mark.svg'), 'utf8'),
);
const markStart = markRaw.indexOf('<g id="Group 1">');
const markEnd = markRaw.lastIndexOf('</svg>');
const markInner = markRaw.slice(markStart, markEnd).trim();
const profileXml = [
  '<svg overflow="visible" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">',
  '<g id="Icon">',
  '<g transform="translate(2.8333 1.1667)">',
  markInner,
  '</g>',
  '</g>',
  '</svg>',
].join('\n');

fs.writeFileSync(path.join(iconsDir, 'profile.svg'), `${profileXml}\n`);

const icons = [
  ['profile', 'SETTINGS_PROFILE_XML', 'clip_settings_profile'],
  ['rocket', 'SETTINGS_ROCKET_XML', 'clip_settings_rocket'],
  ['sparkle', 'SETTINGS_SPARKLE_XML', 'clip_settings_sparkle'],
  ['bank', 'SETTINGS_BANK_XML', 'clip_settings_bank'],
  ['chevron', 'SETTINGS_CHEVRON_XML', 'clip_settings_chevron'],
  ['edit', 'SETTINGS_EDIT_XML', 'clip_settings_edit'],
  ['star', 'SETTINGS_STAR_XML', 'clip_settings_star'],
  ['sliders', 'SETTINGS_SLIDERS_XML', 'clip_settings_sliders'],
  ['card', 'SETTINGS_CARD_XML', 'clip_settings_card'],
  ['key', 'SETTINGS_KEY_XML', 'clip_settings_key'],
  ['password', 'SETTINGS_PASSWORD_XML', 'clip_settings_password'],
  ['biometrics', 'SETTINGS_BIOMETRICS_XML', 'clip_settings_biometrics'],
  ['report', 'SETTINGS_REPORT_XML', 'clip_settings_report'],
  ['support', 'SETTINGS_SUPPORT_XML', 'clip_settings_support'],
  ['logout', 'SETTINGS_LOGOUT_XML', 'clip_settings_logout'],
  ['crown', 'SETTINGS_CROWN_XML', 'clip_settings_crown'],
];

let iconOut =
  '/** Figma-exported SVG markup for the Configuracoes screen. */\n\n';
for (const [file, name, clipId] of icons) {
  const xml = clean(
    fs.readFileSync(path.join(iconsDir, `${file}.svg`), 'utf8'),
    clipId,
  );
  iconOut += toTs(name, xml) + '\n';
}

const dstIcons = path.resolve(
  'src/presentation/components/ui/settings-icon-xml.ts',
);
fs.writeFileSync(dstIcons, iconOut);

const banks = [
  ['santander', 'BANK_SANTANDER_XML'],
  ['banco-do-brasil', 'BANK_BB_XML'],
  ['nubank-mark', 'BANK_NUBANK_MARK_XML'],
  ['caixa-mark', 'BANK_CAIXA_MARK_XML'],
  ['c6', 'BANK_C6_XML'],
  ['itau', 'BANK_ITAU_XML'],
];

let bankOut =
  '/** Figma-exported SVG markup for bank logos on Configuracoes. */\n\n';
for (const [file, name] of banks) {
  const xml = clean(fs.readFileSync(path.join(banksDir, `${file}.svg`), 'utf8'));
  bankOut += toTs(name, xml) + '\n';
}

const dstBanks = path.resolve('src/presentation/components/ui/bank-logo-xml.ts');
fs.writeFileSync(dstBanks, bankOut);

console.log(`wrote icons to ${dstIcons}`);
console.log(`wrote banks to ${dstBanks}`);
