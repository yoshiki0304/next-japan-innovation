const SHEET_NAME = 'コラム管理';
const HEADERS = ['公開状態','ID','投稿日','カテゴリ','タイトル','概要','本文','サムネイルURL','タグ'];

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.clear();
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#0b3f86').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.getRange(2,1,2,HEADERS.length).setValues([
    ['公開','sample-news','2026-07-16','お知らせ','コラム管理を開始しました','Googleスプレッドシートから更新できるようになりました。','本文はこのセルに入力します。\n\n空行を入れると段落として表示されます。','https://example.com/image.jpg','NEWS,運用'],
    ['下書き','draft-example','2026-07-17','ホームページ','下書きの記事例','公開状態を「公開」にすると表示されます。','公開前の記事です。','','下書き']
  ]);
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.setColumnWidth(7, 420);
  sheet.setColumnWidth(8, 320);
  SpreadsheetApp.getUi().alert('コラム管理シートを作成しました。');
}

function doGet(e) {
  const output = { updatedAt: new Date().toISOString(), articles: readArticles_() };
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}

function readArticles_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const rows = values.slice(1);
  return rows.map(row => ({
    status: row[0], id: row[1], date: normalizeDate_(row[2]), category: row[3], title: row[4], excerpt: row[5],
    body: String(row[6] || '').split(/\n\s*\n/).map(v => v.trim()).filter(Boolean),
    image: normalizeImageUrl_(row[7]), tags: String(row[8] || '').split(',').map(v => v.trim()).filter(Boolean)
  })).filter(v => v.status === '公開' && v.id && v.title).sort((a,b) => String(b.date).localeCompare(String(a.date)));
}

function normalizeDate_(value) {
  const text = String(value || '').trim().replace(/[./]/g,'-');
  const m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}` : text;
}

function normalizeImageUrl_(url) {
  const text = String(url || '').trim();
  const drive = text.match(/\/d\/([a-zA-Z0-9_-]+)/) || text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return drive ? `https://drive.google.com/uc?export=view&id=${drive[1]}` : text;
}
