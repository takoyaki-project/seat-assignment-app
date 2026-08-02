// 全体の状態管理
var currentStep = 1;
var students = []; // { id: number, gender: 'male'|'female' }
var selectedSeatIdx = null; // 手動入れ替え用の選択座席インデックス

// ページ読み込み完了時に初期化
window.addEventListener('load', function() {
  initApp();
});

function initApp() {
  // 要素の取得
  var btnDemo = document.getElementById('btn-demo');
  var btnGenerate = document.getElementById('btn-generate');
  var btnSaveClass = document.getElementById('btn-save-class');
  var btnLoadClass = document.getElementById('btn-load-class');
  var btnAddNg = document.getElementById('btn-add-ng');
  var btnAddWant = document.getElementById('btn-add-want');
  var btnAddFarNg = document.getElementById('btn-add-far-ng');
  var btnAddNearWant = document.getElementById('btn-add-near-want');
  var btnAddFixed = document.getElementById('btn-add-fixed');
  var btnAddFront = document.getElementById('btn-add-front');
  var btnRun = document.getElementById('btn-run');
  var btnPrint = document.getElementById('btn-print');
  var btnShare = document.getElementById('btn-share');
  var btnRetry = document.getElementById('btn-retry');

  var inpRows = document.getElementById('inp-rows');
  var inpCols = document.getElementById('inp-cols');

  // 1. 席数自動計算のセットアップ
  if (inpRows && inpCols) {
    var calcCapacity = function() {
      var r = parseInt(inpRows.value) || 0;
      var c = parseInt(inpCols.value) || 0;
      var txtCapacity = document.getElementById('txt-capacity');
      if (txtCapacity) {
        txtCapacity.textContent = (r * c) + '席';
      }
    };
    inpRows.addEventListener('input', calcCapacity);
    inpCols.addEventListener('input', calcCapacity);
    calcCapacity(); // 初回計算
  }

  // 2. ローカルストレージ（保存機能）の確認
  if (localStorage.getItem('saved_classroom_students')) {
    if (btnLoadClass) btnLoadClass.classList.remove('hidden');
  }

  // 3. 全てのボタンにクリックイベントを正しく登録
  if (btnDemo) btnDemo.addEventListener('click', onClickDemo);
  if (btnGenerate) btnGenerate.addEventListener('click', onClickNextStep);
  if (btnSaveClass) btnSaveClass.addEventListener('click', onClickSaveClass);
  if (btnLoadClass) btnLoadClass.addEventListener('click', onClickLoadClass);
  
  if (btnAddNg) btnAddNg.addEventListener('click', function() { addConditionInput('ng'); });
  if (btnAddWant) btnAddWant.addEventListener('click', function() { addConditionInput('want'); });
  if (btnAddFarNg) btnAddFarNg.addEventListener('click', function() { addConditionInput('far-ng'); });
  if (btnAddNearWant) btnAddNearWant.addEventListener('click', function() { addConditionInput('near-want'); });
  if (btnAddFixed) btnAddFixed.addEventListener('click', function() { addConditionInput('fixed'); });
  if (btnAddFront) btnAddFront.addEventListener('click', function() { addConditionInput('front'); });
  
  if (btnRun) btnRun.addEventListener('click', onClickRunShuffle);
  if (btnPrint) btnPrint.addEventListener('click', function() { window.print(); });
  if (btnShare) btnShare.addEventListener('click', onClickShare);
  if (btnRetry) btnRetry.addEventListener('click', onClickRetry);

  // 男女ルールラジオボタンの切り替えイベント
  var rdGenders = document.getElementsByName('genderRule');
  for (var i = 0; i < rdGenders.length; i++) {
    rdGenders[i].addEventListener('change', toggleGenderRowSettings);
  }
}

// 【1】デモデータで試す機能
function onClickDemo() {
  var inpRows = document.getElementById('inp-rows');
  var inpCols = document.getElementById('inp-cols');
  var inpCount = document.getElementById('inp-count');

  if (inpRows) inpRows.value = 5;
  if (inpCols) inpCols.value = 6;
  if (inpCount) inpCount.value = 28;

  var txtCapacity = document.getElementById('txt-capacity');
  if (txtCapacity) txtCapacity.textContent = '30席';

  // 一度生徒データをリセットしてデモ用に作り直す
  students = [];
  for (var i = 1; i <= 28; i++) {
    // デモ用に男子と女子を交互にする
    var gen = (i % 2 === 0) ? 'female' : 'male';
    students.push({ id: i, gender: gen });
  }

  // ステップ2を表示させる処理を実行
  onClickNextStep();

  // デモ用の条件入力欄を自動で追加して数字を入れる
  addConditionInput('ng', [1, 2]);   // 1番と2番は隣NG
  addConditionInput('front', [3, 2]); // 3番は前から2行目まで
}

// 【2】次へ → ボタン（生徒数の確定と画面表示）
function onClickNextStep() {
  var inpRows = document.getElementById('inp-rows');
  var inpCols = document.getElementById('inp-cols');
  var inpCount = document.getElementById('inp-count');

  var rows = parseInt(inpRows.value) || 0;
  var cols = parseInt(inpCols.value) || 0;
  var count = parseInt(inpCount.value) || 0;

  if (count > (rows * cols)) {
    alert('生徒数が座席数（' + (rows * cols) + '席）を超えています。');
    return;
  }
  if (count <= 0) {
    alert('生徒数を1人以上入力してください。');
    return;
  }

  // 既に設定済みの性別は保ったまま、人数の増減分だけ調整する
  // （以前は人数を変えると全員の性別が男子にリセットされていた）
  if (students.length !== count) {
    if (students.length > count) {
      students = students.slice(0, count);
    } else {
      for (var i = students.length + 1; i <= count; i++) {
        students.push({ id: i, gender: 'male' });
      }
    }
  }

  // グリッドを画面に描画
  renderStudentGrid();

  // HTMLの「hidden」クラスを外して、ステップ2・3・実行ボタンを一気に表示する
  var step2 = document.getElementById('section-step2');
  var step3 = document.getElementById('section-step3');
  var exec = document.getElementById('section-execute');

  if (step2) step2.classList.remove('hidden');
  if (step3) step3.classList.remove('hidden');
  if (exec) exec.classList.remove('hidden');
}

// 生徒の性別切り替えボタン（ステップ2）の描画
function renderStudentGrid() {
  var grid = document.getElementById('student-grid');
  if (!grid) return;
  grid.innerHTML = '';

  students.forEach(function(st) {
    var btn = document.createElement('button');
    btn.className = 'student-chip ' + (st.gender === 'male' ? 'male' : 'female');
    btn.type = 'button';
    
    var label = st.gender === 'male' ? '[男]' : '[女]';
    btn.textContent = st.id + '番 ' + label;

    // クリックで性別反転
    btn.addEventListener('click', function() {
      if (st.gender === 'male') {
        st.gender = 'female';
        btn.className = 'student-chip female';
        btn.textContent = st.id + '番 [女]';
      } else {
        st.gender = 'male';
        btn.className = 'student-chip male';
        btn.textContent = st.id + '番 [男]';
      }
      updateGenderRowGrid();
    });
    grid.appendChild(btn);
  });

  updateGenderRowGrid();
}

// クラス情報の保存
function onClickSaveClass() {
  var config = {
    rows: document.getElementById('inp-rows').value,
    cols: document.getElementById('inp-cols').value,
    count: document.getElementById('inp-count').value,
    students: students
  };
  localStorage.setItem('saved_classroom_students', JSON.stringify(config));
  alert('クラスの情報をブラウザに保存しました！');
  
  var btnLoadClass = document.getElementById('btn-load-class');
  if (btnLoadClass) btnLoadClass.classList.remove('hidden');
}

// クラス情報の読み込み
function onClickLoadClass() {
  var dataStr = localStorage.getItem('saved_classroom_students');
  if (!dataStr) return;

  var config;
  try {
    config = JSON.parse(dataStr);
    if (!config || !config.students || !config.students.length) {
      throw new Error('invalid data');
    }
  } catch (e) {
    // 保存データが壊れている場合は、伝えた上で片付ける（無言で無反応にならないように）
    alert('保存されたクラス情報が読み込めませんでした。\nお手数ですが、もう一度設定して保存し直してください。');
    localStorage.removeItem('saved_classroom_students');
    var btnLoad = document.getElementById('btn-load-class');
    if (btnLoad) btnLoad.classList.add('hidden');
    return;
  }

  document.getElementById('inp-rows').value = config.rows;
  document.getElementById('inp-cols').value = config.cols;
  document.getElementById('inp-count').value = config.count;
  
  var txtCapacity = document.getElementById('txt-capacity');
  if (txtCapacity) txtCapacity.textContent = (config.rows * config.cols) + '席';

  students = config.students;
  onClickNextStep();
  alert('前回のクラス情報を読み込みました。');
}

// 列ごとルールの表示切り替え
function toggleGenderRowSettings() {
  var checkedRadio = document.querySelector('input[name="genderRule"]:checked');
  var block = document.getElementById('col-gender-settings');
  if (block && checkedRadio) {
    if (checkedRadio.value === 'columns') {
      block.classList.remove('hidden');
    } else {
      block.classList.add('hidden');
    }
  }

  var checkerHint = document.getElementById('checkerboard-hint');
  if (checkerHint && checkedRadio) {
    if (checkedRadio.value === 'checkerboard') {
      checkerHint.classList.remove('hidden');
    } else {
      checkerHint.classList.add('hidden');
    }
  }
}

// 列ごとの男女選択肢の更新
function updateGenderRowGrid() {
  var grid = document.getElementById('col-gender-grid');
  if (!grid) return;
  grid.innerHTML = '';

  var cols = parseInt(document.getElementById('inp-cols').value) || 0;
  for (var c = 1; c <= cols; c++) {
    var div = document.createElement('div');
    div.className = 'col-gender-cell';
    
    var label = document.createElement('div');
    label.className = 'col-label';
    label.textContent = '左から' + c + '列目';
    div.appendChild(label);

    var sel = document.createElement('select');
    sel.className = 'sel-col-gender';
    sel.setAttribute('data-col', c);
    
    var optM = document.createElement('option'); optM.value = 'mixed'; optM.textContent = '混合';
    var optB = document.createElement('option'); optB.value = 'male'; optB.textContent = '男子のみ';
    var optG = document.createElement('option'); optG.value = 'female'; optG.textContent = '女子のみ';
    
    sel.appendChild(optM);
    sel.appendChild(optB);
    sel.appendChild(optG);
    
    div.appendChild(sel);
    grid.appendChild(div);
  }
}

// 条件入力フォームの追加
function addConditionInput(type, defaultVals) {
  var container = document.getElementById('list-' + type);
  if (!container) return;

  var div = document.createElement('div');
  div.className = 'condition-item';

  var html = '';
  if (type === 'ng') {
    var v1 = defaultVals ? defaultVals[0] : '';
    var v2 = defaultVals ? defaultVals[1] : '';
    html += '<input type="number" class="val-ng-1" placeholder="番号" value="' + v1 + '" /> と ';
    html += '<input type="number" class="val-ng-2" placeholder="番号" value="' + v2 + '" /> はNG';
  } else if (type === 'want') {
    var w1 = defaultVals ? defaultVals[0] : '';
    var w2 = defaultVals ? defaultVals[1] : '';
    html += '<input type="number" class="val-want-1" placeholder="番号" value="' + w1 + '" /> と ';
    html += '<input type="number" class="val-want-2" placeholder="番号" value="' + w2 + '" /> を隣にする';
  } else if (type === 'far-ng') {
    var fn1 = defaultVals ? defaultVals[0] : '';
    var fn2 = defaultVals ? defaultVals[1] : '';
    html += '<input type="number" class="val-far-ng-1" placeholder="番号" value="' + fn1 + '" /> と ';
    html += '<input type="number" class="val-far-ng-2" placeholder="番号" value="' + fn2 + '" /> を2マス以上離す';
  } else if (type === 'near-want') {
    var nw1 = defaultVals ? defaultVals[0] : '';
    var nw2 = defaultVals ? defaultVals[1] : '';
    html += '<input type="number" class="val-near-want-1" placeholder="番号" value="' + nw1 + '" /> と ';
    html += '<input type="number" class="val-near-want-2" placeholder="番号" value="' + nw2 + '" /> を近く（2マス以内）にする';
  } else if (type === 'fixed') {
    html += '<input type="number" class="val-fixed-id" placeholder="番号" /> 番の子を ';
    html += '前から <input type="number" class="val-fixed-r" placeholder="行" />行目・';
    html += '左から <input type="number" class="val-fixed-c" placeholder="列" />列目に指定';
  } else if (type === 'front') {
    var f1 = defaultVals ? defaultVals[0] : '';
    var f2 = defaultVals ? defaultVals[1] : '';
    html += '<input type="number" class="val-front-id" placeholder="番号" value="' + f1 + '" /> 番の子は ';
    html += '前から <input type="number" class="val-front-row" placeholder="行数" value="' + f2 + '" /> 行目まで';
  }

  html += ' <button type="button" class="btn-del-cond">✕</button>';
  div.innerHTML = html;

  div.querySelector('.btn-del-cond').addEventListener('click', function() {
    div.remove();
  });

  container.appendChild(div);
}

// 現在の画面の入力条件を集める
function collectConditions() {
  var checkedRadio = document.querySelector('input[name="genderRule"]:checked');
  var conds = {
    ng: [],
    want: [],
    farNg: [],
    nearWant: [],
    fixed: [],
    front: [],
    genderRule: checkedRadio ? checkedRadio.value : 'mixed',
    colGenders: {},
    // 格子状の開始性別（多い方）。validateConditionsとassignSeatsで同じ判定結果を使うため、ここで1回だけ求める
    checkerStart: getCheckerStart(students)
  };

  var itemsNg = document.querySelectorAll('#list-ng .condition-item');
  itemsNg.forEach(function(item) {
    var id1 = parseInt(item.querySelector('.val-ng-1').value);
    var id2 = parseInt(item.querySelector('.val-ng-2').value);
    if (id1 && id2) conds.ng.push([id1, id2]);
  });

  var itemsWant = document.querySelectorAll('#list-want .condition-item');
  itemsWant.forEach(function(item) {
    var id1 = parseInt(item.querySelector('.val-want-1').value);
    var id2 = parseInt(item.querySelector('.val-want-2').value);
    if (id1 && id2) conds.want.push([id1, id2]);
  });

  var itemsFarNg = document.querySelectorAll('#list-far-ng .condition-item');
  itemsFarNg.forEach(function(item) {
    var id1 = parseInt(item.querySelector('.val-far-ng-1').value);
    var id2 = parseInt(item.querySelector('.val-far-ng-2').value);
    if (id1 && id2) conds.farNg.push([id1, id2]);
  });

  var itemsNearWant = document.querySelectorAll('#list-near-want .condition-item');
  itemsNearWant.forEach(function(item) {
    var id1 = parseInt(item.querySelector('.val-near-want-1').value);
    var id2 = parseInt(item.querySelector('.val-near-want-2').value);
    if (id1 && id2) conds.nearWant.push([id1, id2]);
  });

  var itemsFixed = document.querySelectorAll('#list-fixed .condition-item');
  itemsFixed.forEach(function(item) {
    var id = parseInt(item.querySelector('.val-fixed-id').value);
    var r = parseInt(item.querySelector('.val-fixed-r').value);
    var c = parseInt(item.querySelector('.val-fixed-c').value);
    if (id && r && c) conds.fixed.push({ id: id, row: r, col: c });
  });

  var itemsFront = document.querySelectorAll('#list-front .condition-item');
  itemsFront.forEach(function(item) {
    var id = parseInt(item.querySelector('.val-front-id').value);
    var maxR = parseInt(item.querySelector('.val-front-row').value);
    if (id && maxR) conds.front.push({ id: id, maxRow: maxR });
  });

  var sels = document.querySelectorAll('.sel-col-gender');
  sels.forEach(function(sel) {
    var colIdx = parseInt(sel.getAttribute('data-col'));
    conds.colGenders[colIdx] = sel.value;
  });

  return conds;
}

// 【3】席替え実行処理
var currentSeatsResult = [];
var currentRows = 0;
var currentCols = 0;

// 格子状（市松模様）のマス性別を返す（row/colは1始まり）
// (row + col) が偶数 → 開始性別（多い方）、奇数 → 逆の性別
function checkerGenderAt(row, col, startGender) {
  var isStart = ((row + col) % 2 === 0);
  var other = (startGender === 'male') ? 'female' : 'male';
  return isStart ? startGender : other;
}

// 格子状の開始性別（多い方）を求める。同数なら男子始まり
function getCheckerStart(studentsList) {
  var maleCount = 0, femaleCount = 0;
  studentsList.forEach(function(st) {
    if (st.gender === 'male') { maleCount++; } else { femaleCount++; }
  });
  return (femaleCount > maleCount) ? 'female' : 'male';
}

// その席（row/colは1始まり）に座れる性別を返す。制限がなければnull
// （列ごとルール／格子状の両方に対応。混合ルールでは常にnull）
function seatGenderRequirement(cond, row, col) {
  if (cond.genderRule === 'columns') {
    var colRule = cond.colGenders[col];
    if (colRule === 'male' || colRule === 'female') return colRule;
    return null;
  }
  if (cond.genderRule === 'checkerboard') {
    return checkerGenderAt(row, col, cond.checkerStart);
  }
  return null;
}

// 前からlimitRow行目までの格子状マスのうち、指定した性別のマス数を数える
function countCheckerSeats(limitRow, cols, gender, checkerStart) {
  var count = 0;
  for (var r = 1; r <= limitRow; r++) {
    for (var c = 1; c <= cols; c++) {
      if (checkerGenderAt(r, c, checkerStart) === gender) count++;
    }
  }
  return count;
}

// 実行前の条件チェック（無理な条件を具体的に教える）
function validateConditions(rows, cols, studentsList, cond) {
  var msgs = [];
  var ids = {};
  studentsList.forEach(function(st) { ids[st.id] = st; });

  // 隣同士NG
  cond.ng.forEach(function(pair) {
    if (!ids[pair[0]]) msgs.push('隣同士NG: ' + pair[0] + '番の生徒は存在しません。');
    if (!ids[pair[1]]) msgs.push('隣同士NG: ' + pair[1] + '番の生徒は存在しません。');
    if (pair[0] === pair[1]) msgs.push('隣同士NG: 同じ番号（' + pair[0] + '番）同士が指定されています。');
  });

  // 指定席
  var usedSeats = {};
  var usedIds = {};
  cond.fixed.forEach(function(fx) {
    if (!ids[fx.id]) msgs.push('指定席: ' + fx.id + '番の生徒は存在しません。');
    if (fx.row > rows || fx.col > cols) {
      msgs.push('指定席: ' + fx.id + '番の席（' + fx.row + '行' + fx.col + '列）が教室の範囲外です。');
    }
    var seatKey = fx.row + '-' + fx.col;
    if (usedSeats[seatKey]) msgs.push('指定席: ' + fx.row + '行' + fx.col + '列に複数の生徒が指定されています。');
    usedSeats[seatKey] = true;
    if (usedIds[fx.id]) msgs.push('指定席: ' + fx.id + '番の生徒が複数の席に指定されています。');
    usedIds[fx.id] = true;
  });

  // 前の席に配置
  cond.front.forEach(function(f) {
    if (!ids[f.id]) msgs.push('前の席に配置: ' + f.id + '番の生徒は存在しません。');
  });

  // 指定席と前列指定の矛盾
  cond.fixed.forEach(function(fx) {
    cond.front.forEach(function(f) {
      if (fx.id === f.id && fx.row > f.maxRow) {
        msgs.push(fx.id + '番: 指定席が' + fx.row + '行目なのに「前から' + f.maxRow + '行目まで」の条件があり、矛盾しています。');
      }
    });
  });

  // 列ごと男女ルールの席数チェック
  if (cond.genderRule === 'columns') {
    var maleOnlyCols = 0;
    var femaleOnlyCols = 0;
    for (var c = 1; c <= cols; c++) {
      if (cond.colGenders[c] === 'male') maleOnlyCols++;
      if (cond.colGenders[c] === 'female') femaleOnlyCols++;
    }
    var males = studentsList.filter(function(s) { return s.gender === 'male'; }).length;
    var females = studentsList.length - males;
    var maleSeats = (cols - femaleOnlyCols) * rows;   // 男子が座れる席（男子列＋混合列）
    var femaleSeats = (cols - maleOnlyCols) * rows;   // 女子が座れる席（女子列＋混合列）
    if (males > maleSeats) {
      msgs.push('男子' + males + '人に対して、男子が座れる席が' + maleSeats + '席しかありません。列の男女設定を見直してください。');
    }
    if (females > femaleSeats) {
      msgs.push('女子' + females + '人に対して、女子が座れる席が' + femaleSeats + '席しかありません。列の男女設定を見直してください。');
    }
  }

  // 指定席の生徒の性別と、列の男女ルールの矛盾
  // （例: 女子の生徒を男子列に指定 → どれだけシャッフルしても成功しない）
  if (cond.genderRule === 'columns') {
    cond.fixed.forEach(function(fx) {
      var st = ids[fx.id];
      if (!st) return;
      var colRule = cond.colGenders[fx.col];
      if (colRule === 'male' && st.gender !== 'male') {
        msgs.push('指定席: ' + fx.id + '番（女子）が左から' + fx.col + '列目に指定されていますが、左から' + fx.col + '列目は男子の列です。');
      }
      if (colRule === 'female' && st.gender !== 'female') {
        msgs.push('指定席: ' + fx.id + '番（男子）が左から' + fx.col + '列目に指定されていますが、左から' + fx.col + '列目は女子の列です。');
      }
    });
  }

  // 指定席の生徒の性別と、格子状（市松模様）のマス性別の矛盾
  if (cond.genderRule === 'checkerboard') {
    cond.fixed.forEach(function(fx) {
      var st = ids[fx.id];
      if (!st) return;
      if (fx.row > rows || fx.col > cols) return; // 範囲外は別チェックで警告済み
      var required = checkerGenderAt(fx.row, fx.col, cond.checkerStart);
      if (st.gender !== required) {
        var reqLabel = required === 'male' ? '男子' : '女子';
        var stLabel = st.gender === 'male' ? '男子' : '女子';
        msgs.push('指定席: ' + fx.id + '番（' + stLabel + '）が前から' + fx.row + '行目・左から' + fx.col + '列目に指定されていますが、格子状ではそのマスは' + reqLabel + 'の位置です。');
      }
    });
  }

  // 隣同士NGの2人が、指定席どうしで隣になっている
  var fixedById = {};
  cond.fixed.forEach(function(fx) { fixedById[fx.id] = fx; });
  cond.ng.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    if (f1 && f2 && f1.row === f2.row && Math.abs(f1.col - f2.col) === 1) {
      msgs.push('隣同士NG: ' + pair[0] + '番と' + pair[1] + '番は隣同士NGですが、指定席どうしが隣（' + f1.row + '行' + f1.col + '列と' + f2.row + '行' + f2.col + '列）になっています。');
    }
  });

  // 前の席に配置: 前列の席数が足りない
  // 生徒ごとに一番厳しい「前から何行目まで」を求める（指定席のある生徒は指定席側で数える）
  var frontLimit = {};
  cond.front.forEach(function(f) {
    if (!ids[f.id]) return;
    if (frontLimit[f.id] === undefined || f.maxRow < frontLimit[f.id]) frontLimit[f.id] = f.maxRow;
  });
  var rowsToCheck = {};
  Object.keys(frontLimit).forEach(function(idKey) { rowsToCheck[frontLimit[idKey]] = true; });
  Object.keys(rowsToCheck).forEach(function(rKey) {
    var limitRow = parseInt(rKey);
    var needAll = 0, needMale = 0, needFemale = 0;
    Object.keys(frontLimit).forEach(function(idKey) {
      var stId = parseInt(idKey);
      if (frontLimit[stId] > limitRow) return;
      if (fixedById[stId]) return;
      needAll++;
      if (ids[stId].gender === 'male') { needMale++; } else { needFemale++; }
    });
    cond.fixed.forEach(function(fx) {
      var st = ids[fx.id];
      if (!st || fx.row > limitRow) return;
      needAll++;
      if (st.gender === 'male') { needMale++; } else { needFemale++; }
    });
    var seatAll = limitRow * cols;
    if (needAll > seatAll) {
      msgs.push('前の席に配置: 前から' + limitRow + '行目までの席は' + seatAll + '席ですが、そこに入る条件の生徒が' + needAll + '人います。');
    }
    if (cond.genderRule === 'columns') {
      var maleColCount = 0, femaleColCount = 0;
      for (var cc = 1; cc <= cols; cc++) {
        if (cond.colGenders[cc] === 'male') maleColCount++;
        if (cond.colGenders[cc] === 'female') femaleColCount++;
      }
      var seatMale = limitRow * (cols - femaleColCount);
      var seatFemale = limitRow * (cols - maleColCount);
      if (needMale > seatMale) {
        msgs.push('前の席に配置: 前から' + limitRow + '行目までに男子が座れる席は' + seatMale + '席ですが、そこに入る条件の男子が' + needMale + '人います。');
      }
      if (needFemale > seatFemale) {
        msgs.push('前の席に配置: 前から' + limitRow + '行目までに女子が座れる席は' + seatFemale + '席ですが、そこに入る条件の女子が' + needFemale + '人います。');
      }
    }
    if (cond.genderRule === 'checkerboard') {
      var seatMaleChecker = countCheckerSeats(limitRow, cols, 'male', cond.checkerStart);
      var seatFemaleChecker = countCheckerSeats(limitRow, cols, 'female', cond.checkerStart);
      if (needMale > seatMaleChecker) {
        msgs.push('前の席に配置: 前から' + limitRow + '行目までに男子が座れる格子のマスは' + seatMaleChecker + 'マスですが、そこに入る条件の男子が' + needMale + '人います。');
      }
      if (needFemale > seatFemaleChecker) {
        msgs.push('前の席に配置: 前から' + limitRow + '行目までに女子が座れる格子のマスは' + seatFemaleChecker + 'マスですが、そこに入る条件の女子が' + needFemale + '人います。');
      }
    }
  });

  // 隣にしたい: 存在確認・自己ペア確認（NGの既存チェックと同じ考え方）
  cond.want.forEach(function(pair) {
    if (!ids[pair[0]]) msgs.push('隣にしたい: ' + pair[0] + '番の生徒は存在しません。');
    if (!ids[pair[1]]) msgs.push('隣にしたい: ' + pair[1] + '番の生徒は存在しません。');
    if (pair[0] === pair[1]) msgs.push('隣にしたい: 同じ番号（' + pair[0] + '番）同士が指定されています。');
  });

  // 隣にしたい: 同じ生徒が複数の「隣にしたい」に登場（2人ペアのみの仕様に反する）
  var wantAppearCount = {};
  cond.want.forEach(function(pair) {
    wantAppearCount[pair[0]] = (wantAppearCount[pair[0]] || 0) + 1;
    wantAppearCount[pair[1]] = (wantAppearCount[pair[1]] || 0) + 1;
  });
  Object.keys(wantAppearCount).forEach(function(idKey) {
    if (wantAppearCount[idKey] > 1) {
      msgs.push('隣にしたい: ' + idKey + '番が複数の「隣にしたい」に指定されています。今は1人につき1組までにしてください。');
    }
  });

  // 隣にしたい: 両方が指定席で、隣り合っていない
  cond.want.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    if (f1 && f2 && !(f1.row === f2.row && Math.abs(f1.col - f2.col) === 1)) {
      msgs.push('隣にしたい: ' + pair[0] + '番と' + pair[1] + '番はどちらも指定席ですが、指定席どうしが隣になっていません（' + f1.row + '行' + f1.col + '列と' + f2.row + '行' + f2.col + '列）。');
    }
  });

  // 隣にしたい: 一方が指定席で、その隣に相手を置ける場所がない
  cond.want.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    var fixedSide = null, otherId = null;
    if (f1 && !f2) { fixedSide = f1; otherId = pair[1]; }
    else if (f2 && !f1) { fixedSide = f2; otherId = pair[0]; }
    else { return; } // 両方指定席・両方未指定は他のチェックに委ねる

    var otherSt = ids[otherId];
    if (!otherSt) return; // 存在チェックは別途
    if (fixedSide.row > rows || fixedSide.col > cols) return; // 範囲外は別チェックで警告済み

    var adjCols = [];
    if (fixedSide.col > 1) adjCols.push(fixedSide.col - 1);
    if (fixedSide.col < cols) adjCols.push(fixedSide.col + 1);

    var hasSeat = adjCols.some(function(adjCol) {
      // 隣のマスが別の生徒の指定席で埋まっているなら置けない
      var occupied = cond.fixed.some(function(fx) {
        return fx.row === fixedSide.row && fx.col === adjCol && fx.id !== otherId;
      });
      if (occupied) return false;
      var required = seatGenderRequirement(cond, fixedSide.row, adjCol);
      return !required || required === otherSt.gender;
    });

    if (!hasSeat) {
      msgs.push('隣にしたい: ' + fixedSide.id + '番の指定席（左から' + fixedSide.col + '列目）の隣に、相手の' + otherId + '番を置ける場所がありません。');
    }
  });

  // 隣にしたい: 男女ルールとの衝突（同性ペア × 格子状は隣が必ず男女になるため不可）
  // ※ 列指定との細かい衝突判定は複雑になるため、まずは格子状との衝突だけを確実に警告する。
  //   列指定側は「実行してみて無理なら既存の見つかりませんでしたに委ねる」で割り切る。
  cond.want.forEach(function(pair) {
    var s1 = ids[pair[0]];
    var s2 = ids[pair[1]];
    if (!s1 || !s2) return;
    if (s1.gender === s2.gender && cond.genderRule === 'checkerboard') {
      msgs.push('隣にしたい: ' + pair[0] + '番と' + pair[1] + '番は同性ですが、格子状では隣り合うマスが必ず男女になるため、隣にできません。');
    }
  });

  // 隣にしたい×前列指定: 「両者のmaxRow以下の行に横並びで入れる空きがあるか」の厳密判定は複雑なため、
  // ここでは追加しない。同性×格子状や前列×性別席数の既存チェックでカバーされない稀な矛盾
  // （例: 該当行の候補マスがすべて指定席で埋まっている等）は、assignSeats側でfront制約を
  // 満たす候補だけに絞ったうえで、実行時の「条件を満たす席が見つかりませんでした」に委ねる。

  // 近くにしたくない / 近くにしたい: 存在確認・自己ペア確認
  cond.farNg.forEach(function(pair) {
    if (!ids[pair[0]]) msgs.push('近くにしたくない: ' + pair[0] + '番の生徒は存在しません。');
    if (!ids[pair[1]]) msgs.push('近くにしたくない: ' + pair[1] + '番の生徒は存在しません。');
    if (pair[0] === pair[1]) msgs.push('近くにしたくない: 同じ番号（' + pair[0] + '番）同士が指定されています。');
  });
  cond.nearWant.forEach(function(pair) {
    if (!ids[pair[0]]) msgs.push('近くにしたい: ' + pair[0] + '番の生徒は存在しません。');
    if (!ids[pair[1]]) msgs.push('近くにしたい: ' + pair[1] + '番の生徒は存在しません。');
    if (pair[0] === pair[1]) msgs.push('近くにしたい: 同じ番号（' + pair[0] + '番）同士が指定されています。');
  });

  // 近くにしたくない: 教室が狭くて、そもそも距離3以上の席の組が存在しない
  // （距離3以上が成立するのは rows >= 4 または cols >= 4 のとき）
  var farNgRoomFeasible = (rows >= 4 || cols >= 4);
  if (!farNgRoomFeasible) {
    cond.farNg.forEach(function(pair) {
      if (!ids[pair[0]] || !ids[pair[1]]) return; // 存在チェックは上で警告済み
      msgs.push('近くにしたくない: ' + pair[0] + '番と' + pair[1] + '番を2マス離す指定ですが、この教室の広さ（' + rows + '行×' + cols + '列）では2マス離して座らせることができません。教室を広くするか、「隣にしたくない」条件をお使いください。');
    });
  }

  // 近くにしたくない: 一方が指定席で、そこから距離3以上の席が教室内に無い
  cond.farNg.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    var fixedSide = null, otherId = null;
    if (f1 && !f2) { fixedSide = f1; otherId = pair[1]; }
    else if (f2 && !f1) { fixedSide = f2; otherId = pair[0]; }
    else { return; } // 両方指定席・両方未指定は他のチェックに委ねる
    if (!ids[otherId]) return;
    if (fixedSide.row > rows || fixedSide.col > cols) return; // 範囲外は別チェックで警告済み

    var hasFarSeat = false;
    for (var fr1 = 1; fr1 <= rows && !hasFarSeat; fr1++) {
      for (var fc1 = 1; fc1 <= cols; fc1++) {
        var farDist = Math.max(Math.abs(fr1 - fixedSide.row), Math.abs(fc1 - fixedSide.col));
        if (farDist >= 3) { hasFarSeat = true; break; }
      }
    }
    if (!hasFarSeat) {
      msgs.push('近くにしたくない: ' + fixedSide.id + '番の指定席（前から' + fixedSide.row + '行目・左から' + fixedSide.col + '列目）から2マス離れた席が、この教室にはありません。');
    }
  });

  // 近くにしたくない: 両方が指定席で、距離が足りない
  cond.farNg.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    if (f1 && f2) {
      var farFixedDist = Math.max(Math.abs(f1.row - f2.row), Math.abs(f1.col - f2.col));
      if (farFixedDist < 3) {
        msgs.push('近くにしたくない: ' + pair[0] + '番と' + pair[1] + '番はどちらも指定席ですが、2マスも離れていません（前から' + f1.row + '行目・左から' + f1.col + '列目 と 前から' + f2.row + '行目・左から' + f2.col + '列目）。');
      }
    }
  });

  // 近くにしたい: 両方が指定席で、距離2を超えている
  cond.nearWant.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    if (f1 && f2) {
      var nearFixedDist = Math.max(Math.abs(f1.row - f2.row), Math.abs(f1.col - f2.col));
      if (nearFixedDist > 2) {
        msgs.push('近くにしたい: ' + pair[0] + '番と' + pair[1] + '番はどちらも指定席ですが、離れすぎています（距離2以内にしてください）。');
      }
    }
  });

  // 近くにしたい: 一方が指定席で、その距離2以内に相手を置ける席が無い
  cond.nearWant.forEach(function(pair) {
    var f1 = fixedById[pair[0]];
    var f2 = fixedById[pair[1]];
    var fixedSide = null, otherId = null;
    if (f1 && !f2) { fixedSide = f1; otherId = pair[1]; }
    else if (f2 && !f1) { fixedSide = f2; otherId = pair[0]; }
    else { return; } // 両方指定席・両方未指定は他のチェックに委ねる

    var otherSt = ids[otherId];
    if (!otherSt) return; // 存在チェックは別途
    if (fixedSide.row > rows || fixedSide.col > cols) return; // 範囲外は別チェックで警告済み

    var hasNearSeat = false;
    for (var nr1 = 1; nr1 <= rows && !hasNearSeat; nr1++) {
      for (var nc1 = 1; nc1 <= cols; nc1++) {
        if (nr1 === fixedSide.row && nc1 === fixedSide.col) continue;
        var nearDist = Math.max(Math.abs(nr1 - fixedSide.row), Math.abs(nc1 - fixedSide.col));
        if (nearDist > 2) continue;
        // 別の生徒の指定席で埋まっているなら置けない
        var occupiedNear = cond.fixed.some(function(fx) {
          return fx.row === nr1 && fx.col === nc1 && fx.id !== otherId;
        });
        if (occupiedNear) continue;
        var nearReq = seatGenderRequirement(cond, nr1, nc1);
        if (nearReq && nearReq !== otherSt.gender) continue;
        hasNearSeat = true;
        break;
      }
    }
    if (!hasNearSeat) {
      msgs.push('近くにしたい: ' + fixedSide.id + '番の指定席の近く（2マス以内）に、相手の' + otherId + '番を置ける席がありません。');
    }
  });

  // 近くにしたい: 男女ルールとの衝突について
  // → 距離2以内なら男女どちらの席も選べる組み合わせが必ず残るため、
  //   「隣にしたい」×格子状のような確実な衝突は起きない。よって追加チェックは不要。

  // 同じペアが矛盾する条件に同時に登場していないか
  cond.farNg.forEach(function(fp) {
    cond.nearWant.forEach(function(np) {
      if (pairsMatch(fp, np)) {
        msgs.push('条件の矛盾: ' + fp[0] + '番と' + fp[1] + '番に「近くにしたくない」と「近くにしたい」の両方が指定されています。どちらか一方にしてください。');
      }
    });
    cond.want.forEach(function(wp) {
      if (pairsMatch(fp, wp)) {
        msgs.push('条件の矛盾: ' + fp[0] + '番と' + fp[1] + '番に「近くにしたくない」と「隣にしたい」の両方が指定されています。どちらか一方にしてください。');
      }
    });
  });

  return msgs;
}

function onClickRunShuffle() {
  var inpRows = document.getElementById('inp-rows');
  var inpCols = document.getElementById('inp-cols');
  currentRows = parseInt(inpRows.value) || 0;
  currentCols = parseInt(inpCols.value) || 0;

  var conds = collectConditions();

  // 成功しようがない条件は、試行する前に具体的に伝える
  var problems = validateConditions(currentRows, currentCols, students, conds);
  if (problems.length > 0) {
    alert('⚠️ 条件を確認してください:\n\n' + problems.join('\n'));
    return;
  }

  var success = false;
  var finalSeats = [];

  // 条件に合うまでシャッフルを試行
  for (var t = 0; t < 1500; t++) {
    var attemptResult = assignSeats(currentRows, currentCols, students, conds);
    if (attemptResult) {
      finalSeats = attemptResult;
      success = true;
      break;
    }
  }

  var resSection = document.getElementById('section-result');
  var errDiv = document.getElementById('error-msg');
  var cGrid = document.getElementById('classroom-grid');

  if (resSection) resSection.classList.remove('hidden');
  selectedSeatIdx = null; // 選択状態のクリア

  if (success) {
    currentSeatsResult = finalSeats;
    if (errDiv) { errDiv.classList.add('hidden'); errDiv.textContent = ''; }
    if (cGrid) { cGrid.classList.remove('hidden'); renderClassroom(); }
  } else {
    currentSeatsResult = [];
    if (cGrid) cGrid.classList.add('hidden');
    if (errDiv) {
      errDiv.classList.remove('hidden');
      errDiv.textContent = '⚠️ 条件を満たす席の組み合わせが見つかりませんでした。条件を少し緩めてもう一度お試しください。';
    }
  }
  
  if (resSection) resSection.scrollIntoView({ behavior: 'smooth' });
}

// 座席自動配置アルゴリズム
function assignSeats(rows, cols, studentsList, cond) {
  var totalSeatsCount = rows * cols;
  var seats = [];
  for (var i = 0; i < totalSeatsCount; i++) {
    seats.push(null);
  }

  var unplacedStudents = [].concat(studentsList);

  // 1. 固定席（最優先）
  for (var f = 0; f < cond.fixed.length; f++) {
    var fx = cond.fixed[f];
    if (fx.row > rows || fx.col > cols) return null;
    
    var seatIdx = (fx.row - 1) * cols + (fx.col - 1);
    if (seats[seatIdx] !== null) return null;

    var targetSt = null;
    var targetStIdx = -1;
    for (var s = 0; s < unplacedStudents.length; s++) {
      if (unplacedStudents[s].id === fx.id) {
        targetSt = unplacedStudents[s];
        targetStIdx = s;
        break;
      }
    }
    if (!targetSt) return null;

    if (cond.genderRule === 'columns') {
      var colRule = cond.colGenders[fx.col];
      if (colRule === 'male' && targetSt.gender !== 'male') return null;
      if (colRule === 'female' && targetSt.gender !== 'female') return null;
    }
    if (cond.genderRule === 'checkerboard') {
      var requiredGender = checkerGenderAt(fx.row, fx.col, cond.checkerStart);
      if (targetSt.gender !== requiredGender) return null;
    }

    for (var fr = 0; fr < cond.front.length; fr++) {
      if (cond.front[fr].id === targetSt.id && fx.row > cond.front[fr].maxRow) return null;
    }

    seats[seatIdx] = targetSt;
    unplacedStudents.splice(targetStIdx, 1);
  }

  // 生徒ID → 最も厳しい「前から何行目まで」（front指定がなければ undefined）
  // want配置（front制約を満たす候補に絞る）と、後の前列配置の両方でこの辞書を使い回す
  var frontLimitById = {};
  for (var fli = 0; fli < cond.front.length; fli++) {
    var fEntry = cond.front[fli];
    if (frontLimitById[fEntry.id] === undefined || fEntry.maxRow < frontLimitById[fEntry.id]) {
      frontLimitById[fEntry.id] = fEntry.maxRow;
    }
  }

  // 2. 隣にしたいペア（want）を配置する（fixedの直後）
  // ランダム試行だけでは横並びが偶然にしか起きないため、ここで能動的に空き2マスへ置く
  var findUnplacedById = function(id) {
    for (var wsi = 0; wsi < unplacedStudents.length; wsi++) {
      if (unplacedStudents[wsi].id === id) return wsi;
    }
    return -1;
  };

  for (var w = 0; w < cond.want.length; w++) {
    var wp = cond.want[w];
    var idA = wp[0], idB = wp[1];

    var seatOfA = -1, seatOfB = -1;
    for (var wi = 0; wi < totalSeatsCount; wi++) {
      if (seats[wi] && seats[wi].id === idA) seatOfA = wi;
      if (seats[wi] && seats[wi].id === idB) seatOfB = wi;
    }

    if (seatOfA !== -1 && seatOfB !== -1) {
      // 両方すでに指定席で配置済み。隣接しているかはvalidateConditionsで事前に警告済みの前提
      continue;
    }

    if (seatOfA === -1 && seatOfB === -1) {
      // 両方まだ未配置 → 横に隣り合う空き2マスを探す
      var idxA = findUnplacedById(idA);
      var idxB = findUnplacedById(idB);
      if (idxA === -1 || idxB === -1) return null; // 存在しない生徒（validateConditionsで弾かれているはず）
      var stA = unplacedStudents[idxA];
      var stB = unplacedStudents[idxB];

      // want ペアは必ず同じ行になるので、front制約は「その行が両者のmaxRow以下か」で判定できる
      var limA = frontLimitById[stA.id]; // undefined なら制約なし
      var limB = frontLimitById[stB.id];

      var pairOptions = [];
      for (var pi = 0; pi < totalSeatsCount; pi++) {
        var pCol = (pi % cols) + 1;
        if (pCol === cols) continue; // 右マスが行末を越える
        var leftIdx = pi;
        var rightIdx2 = pi + 1;
        if (seats[leftIdx] !== null || seats[rightIdx2] !== null) continue;

        var pRow = Math.floor(leftIdx / cols) + 1;
        var leftReq = seatGenderRequirement(cond, pRow, pCol);
        var rightReq = seatGenderRequirement(cond, pRow, pCol + 1);
        var frontOk = (limA === undefined || pRow <= limA) && (limB === undefined || pRow <= limB);

        // 左=A・右=B
        if ((!leftReq || leftReq === stA.gender) && (!rightReq || rightReq === stB.gender) && frontOk) {
          pairOptions.push({ left: leftIdx, right: rightIdx2, order: 'AB' });
        }
        // 左=B・右=A
        if ((!leftReq || leftReq === stB.gender) && (!rightReq || rightReq === stA.gender) && frontOk) {
          pairOptions.push({ left: leftIdx, right: rightIdx2, order: 'BA' });
        }
      }
      if (pairOptions.length === 0) return null;
      var chosen = pairOptions[Math.floor(Math.random() * pairOptions.length)];
      if (chosen.order === 'AB') {
        seats[chosen.left] = stA;
        seats[chosen.right] = stB;
      } else {
        seats[chosen.left] = stB;
        seats[chosen.right] = stA;
      }
      // unplacedStudentsから削除（インデックスが大きい方から削除しないとズレる）
      var removeHigh = Math.max(idxA, idxB);
      var removeLow = Math.min(idxA, idxB);
      unplacedStudents.splice(removeHigh, 1);
      unplacedStudents.splice(removeLow, 1);
    } else {
      // 片方が指定席で既に置かれている → その左右の空きマスにもう片方を置く
      var placedSeatIdx = (seatOfA !== -1) ? seatOfA : seatOfB;
      var otherId = (seatOfA !== -1) ? idB : idA;
      var otherIdx = findUnplacedById(otherId);
      if (otherIdx === -1) return null;
      var otherSt = unplacedStudents[otherIdx];

      var placedRow = Math.floor(placedSeatIdx / cols) + 1;
      var placedCol = (placedSeatIdx % cols) + 1;

      // 置こうとしている側にfront制約があるなら、指定席の行がその制約を満たすか確認する
      // （満たさない場合は矛盾なので、後段の事前チェックか既存の失敗メッセージに委ねる）
      var otherLim = frontLimitById[otherSt.id];
      if (otherLim !== undefined && placedRow > otherLim) return null;

      var options2 = [];
      if (placedCol > 1) {
        var leftSeatIdx = placedSeatIdx - 1;
        if (seats[leftSeatIdx] === null) {
          var leftReq2 = seatGenderRequirement(cond, placedRow, placedCol - 1);
          if (!leftReq2 || leftReq2 === otherSt.gender) options2.push(leftSeatIdx);
        }
      }
      if (placedCol < cols) {
        var rightSeatIdx = placedSeatIdx + 1;
        if (seats[rightSeatIdx] === null) {
          var rightReq2 = seatGenderRequirement(cond, placedRow, placedCol + 1);
          if (!rightReq2 || rightReq2 === otherSt.gender) options2.push(rightSeatIdx);
        }
      }
      if (options2.length === 0) return null;
      var pick2 = options2[Math.floor(Math.random() * options2.length)];
      seats[pick2] = otherSt;
      unplacedStudents.splice(otherIdx, 1);
    }
  }

  // 2'. 近くにしたいペア（nearWant）を配置する（wantの直後）
  // want（隣＝距離1）より緩い制約なので、wantを先に処理していれば同じ生徒が両方に
  // 登場していても自動的にnearWantも満たされる（呼び出し順を守ること）。
  for (var nw = 0; nw < cond.nearWant.length; nw++) {
    var nwp = cond.nearWant[nw];
    var idA2 = nwp[0], idB2 = nwp[1];

    var seatOfA2 = -1, seatOfB2 = -1;
    for (var nwi = 0; nwi < totalSeatsCount; nwi++) {
      if (seats[nwi] && seats[nwi].id === idA2) seatOfA2 = nwi;
      if (seats[nwi] && seats[nwi].id === idB2) seatOfB2 = nwi;
    }

    if (seatOfA2 !== -1 && seatOfB2 !== -1) {
      // 両方すでに指定席で配置済み。距離2以内かはvalidateConditionsで事前に警告済みの前提
      continue;
    }

    if (seatOfA2 === -1 && seatOfB2 === -1) {
      // 両方まだ未配置 → チェビシェフ距離2以内の空き2マスの組を探す
      var idxA2 = findUnplacedById(idA2);
      var idxB2 = findUnplacedById(idB2);
      if (idxA2 === -1 || idxB2 === -1) return null; // 存在しない生徒（validateConditionsで弾かれているはず）
      var stA2 = unplacedStudents[idxA2];
      var stB2 = unplacedStudents[idxB2];

      var limA2 = frontLimitById[stA2.id];
      var limB2 = frontLimitById[stB2.id];

      var nearOptions = [];
      for (var s1 = 0; s1 < totalSeatsCount; s1++) {
        if (seats[s1] !== null) continue;
        var row1 = Math.floor(s1 / cols) + 1;
        var col1 = (s1 % cols) + 1;
        if (limA2 !== undefined && row1 > limA2) continue;
        var req1 = seatGenderRequirement(cond, row1, col1);
        if (req1 && req1 !== stA2.gender) continue;

        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            var row2 = row1 + dr;
            var col2 = col1 + dc;
            if (row2 < 1 || row2 > rows || col2 < 1 || col2 > cols) continue;
            if (limB2 !== undefined && row2 > limB2) continue;
            var s2 = (row2 - 1) * cols + (col2 - 1);
            if (seats[s2] !== null) continue;
            var req2 = seatGenderRequirement(cond, row2, col2);
            if (req2 && req2 !== stB2.gender) continue;
            nearOptions.push({ a: s1, b: s2 });
          }
        }
      }
      if (nearOptions.length === 0) return null;
      var chosenNear = nearOptions[Math.floor(Math.random() * nearOptions.length)];
      seats[chosenNear.a] = stA2;
      seats[chosenNear.b] = stB2;
      var removeHigh2 = Math.max(idxA2, idxB2);
      var removeLow2 = Math.min(idxA2, idxB2);
      unplacedStudents.splice(removeHigh2, 1);
      unplacedStudents.splice(removeLow2, 1);
    } else {
      // 片方が指定席で既に置かれている → その2マス以内の空きマスにもう片方を置く
      var placedSeatIdx2 = (seatOfA2 !== -1) ? seatOfA2 : seatOfB2;
      var otherId2 = (seatOfA2 !== -1) ? idB2 : idA2;
      var otherIdx2 = findUnplacedById(otherId2);
      if (otherIdx2 === -1) return null;
      var otherSt2 = unplacedStudents[otherIdx2];

      var placedRow2 = Math.floor(placedSeatIdx2 / cols) + 1;
      var placedCol2 = (placedSeatIdx2 % cols) + 1;
      var otherLim2 = frontLimitById[otherSt2.id];

      var nearOptions2 = [];
      for (var dr2 = -2; dr2 <= 2; dr2++) {
        for (var dc2 = -2; dc2 <= 2; dc2++) {
          if (dr2 === 0 && dc2 === 0) continue;
          var r2 = placedRow2 + dr2;
          var c2 = placedCol2 + dc2;
          if (r2 < 1 || r2 > rows || c2 < 1 || c2 > cols) continue;
          if (otherLim2 !== undefined && r2 > otherLim2) continue;
          var idx2b = (r2 - 1) * cols + (c2 - 1);
          if (seats[idx2b] !== null) continue;
          var req2b = seatGenderRequirement(cond, r2, c2);
          if (req2b && req2b !== otherSt2.gender) continue;
          nearOptions2.push(idx2b);
        }
      }
      if (nearOptions2.length === 0) return null;
      var pickNear = nearOptions2[Math.floor(Math.random() * nearOptions2.length)];
      seats[pickNear] = otherSt2;
      unplacedStudents.splice(otherIdx2, 1);
    }
  }

  // 3. 残りの生徒のランダムシャッフル
  for (var k = unplacedStudents.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var tmp = unplacedStudents[k];
    unplacedStudents[k] = unplacedStudents[j];
    unplacedStudents[j] = tmp;
  }

  // 3.5 前列指定のある生徒を先に配置する
  // （席の選択肢が狭い生徒を後回しにすると、席が埋まって入れなくなるため）
  // frontLimitByIdはwant配置より前で計算済み（②で置かれた生徒はunplacedStudentsから
  // 既に除外されているため、ここでは自然にfrontQueueへ回ってこない＝二重配置しない）
  var frontQueue = [];
  for (var u = unplacedStudents.length - 1; u >= 0; u--) {
    if (frontLimitById[unplacedStudents[u].id] !== undefined) {
      frontQueue.push(unplacedStudents[u]);
      unplacedStudents.splice(u, 1);
    }
  }
  for (var q = 0; q < frontQueue.length; q++) {
    var fst = frontQueue[q];
    var maxRowAllowed = frontLimitById[fst.id];
    // この生徒が座れる空席をすべて集める
    var options = [];
    for (var si = 0; si < totalSeatsCount; si++) {
      if (seats[si] !== null) continue;
      var sRow = Math.floor(si / cols) + 1;
      var sCol = (si % cols) + 1;
      if (sRow > maxRowAllowed) continue;
      if (cond.genderRule === 'columns') {
        var cRule = cond.colGenders[sCol];
        if (cRule === 'male' && fst.gender !== 'male') continue;
        if (cRule === 'female' && fst.gender !== 'female') continue;
      }
      if (cond.genderRule === 'checkerboard') {
        var reqGenderFront = checkerGenderAt(sRow, sCol, cond.checkerStart);
        if (fst.gender !== reqGenderFront) continue;
      }
      options.push(si);
    }
    if (options.length === 0) return null; // 座れる席がない → この試行は失敗
    var pick = options[Math.floor(Math.random() * options.length)];
    seats[pick] = fst;
  }

  // 4. 残りの席を前から埋める
  // （席ごとに「この席に座れる生徒」をシャッフル順で探す。
  //   以前は並び順の先頭の生徒しか見ておらず、列ごとの男女ルールが
  //   ほぼ確実に失敗する原因になっていた）
  for (var idx = 0; idx < totalSeatsCount; idx++) {
    if (seats[idx] !== null) continue;
    if (unplacedStudents.length === 0) break;

    var currentRowNum = Math.floor(idx / cols) + 1;
    var currentColNum = (idx % cols) + 1;
    var foundIdx = -1;

    if (cond.genderRule === 'checkerboard') {
      // 前は市松・余る後方は自由: 求める性別（少ない方）を探し、
      // もう残っていなければ市松をあきらめて残っている任意の生徒（多い方の余り）で埋める
      var neededGender = checkerGenderAt(currentRowNum, currentColNum, cond.checkerStart);
      for (var pc = 0; pc < unplacedStudents.length; pc++) {
        if (unplacedStudents[pc].gender === neededGender) { foundIdx = pc; break; }
      }
      if (foundIdx === -1) foundIdx = 0;
    } else {
      for (var p = 0; p < unplacedStudents.length; p++) {
        var cand = unplacedStudents[p];
        if (cond.genderRule === 'columns') {
          var rule = cond.colGenders[currentColNum];
          if (rule === 'male' && cand.gender !== 'male') continue;
          if (rule === 'female' && cand.gender !== 'female') continue;
        }
        foundIdx = p;
        break;
      }
    }
    if (foundIdx === -1) continue; // この席に座れる生徒がいない → 空席のまま

    seats[idx] = unplacedStudents[foundIdx];
    unplacedStudents.splice(foundIdx, 1);
  }

  if (unplacedStudents.length > 0) return null;

  // 5. 隣NGルール検証 ＋ 近くNG（farNg）判定
  if (!checkNgPairs(seats, cols, cond.ng)) return null;
  if (!checkFarNgPairs(seats, cols, cond.farNg)) return null;

  return seats;
}

// 隣り合うペアのNG判定
function checkNgPairs(seatsArray, cols, ngList) {
  if (ngList.length === 0) return true;
  for (var idx = 0; idx < seatsArray.length; idx++) {
    var st1 = seatsArray[idx];
    if (!st1) continue;
    if ((idx % cols) < (cols - 1)) {
      var rightIdx = idx + 1;
      var st2 = seatsArray[rightIdx];
      if (st2) {
        for (var n = 0; n < ngList.length; n++) {
          var pair = ngList[n];
          if ((st1.id === pair[0] && st2.id === pair[1]) || (st1.id === pair[1] && st2.id === pair[0])) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

// 近くにしたくないペアが、チェビシェフ距離3以上離れているか検査する
function checkFarNgPairs(seatsArray, cols, farNgList) {
  if (farNgList.length === 0) return true;
  var posById = {};
  for (var idx = 0; idx < seatsArray.length; idx++) {
    var st = seatsArray[idx];
    if (!st) continue;
    posById[st.id] = { row: Math.floor(idx / cols) + 1, col: (idx % cols) + 1 };
  }
  for (var n = 0; n < farNgList.length; n++) {
    var pair = farNgList[n];
    var p1 = posById[pair[0]];
    var p2 = posById[pair[1]];
    if (!p1 || !p2) continue;
    var dist = Math.max(Math.abs(p1.row - p2.row), Math.abs(p1.col - p2.col));
    if (dist < 3) return false;
  }
  return true;
}

// 2つの[id, id]ペアが順不同で同じ組を指しているか
function pairsMatch(p1, p2) {
  return (p1[0] === p2[0] && p1[1] === p2[1]) || (p1[0] === p2[1] && p1[1] === p2[0]);
}

// 結果画面（座席）のレンダリング
function renderClassroom() {
  var grid = document.getElementById('classroom-grid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = '34px repeat(' + currentCols + ', 1fr)';

  // 方向の注記（この図は黒板が上＝教室を後ろから見た図）
  var cap = document.createElement('div');
  cap.className = 'grid-caption';
  var capL = document.createElement('span');
  capL.textContent = '← 黒板に向かって左';
  var capR = document.createElement('span');
  capR.textContent = '右 →';
  cap.appendChild(capL);
  cap.appendChild(capR);
  grid.appendChild(cap);

  // 列番号の見出し
  var corner = document.createElement('div');
  grid.appendChild(corner);
  for (var cn = 1; cn <= currentCols; cn++) {
    var colLabel = document.createElement('div');
    colLabel.className = 'grid-col-label';
    colLabel.textContent = cn + '列';
    grid.appendChild(colLabel);
  }

  currentSeatsResult.forEach(function(st, idx) {
    // 各行の先頭に行番号
    if (idx % currentCols === 0) {
      var rowLabel = document.createElement('div');
      rowLabel.className = 'grid-row-label';
      rowLabel.textContent = (Math.floor(idx / currentCols) + 1) + '行';
      grid.appendChild(rowLabel);
    }
    var cell = document.createElement('div');
    cell.className = 'seat';
    cell.setAttribute('data-idx', idx);

    if (st) {
      cell.classList.add(st.gender === 'male' ? 'male' : 'female');
      
      var numSpan = document.createElement('div');
      numSpan.className = 'seat-num';
      numSpan.textContent = st.id + '番';
      
      var genSpan = document.createElement('div');
      genSpan.className = 'seat-gender';
      genSpan.textContent = st.gender === 'male' ? '[男]' : '[女]';

      cell.appendChild(numSpan);
      cell.appendChild(genSpan);
    } else {
      cell.classList.add('empty');
      cell.textContent = 'ー';
    }

    if (selectedSeatIdx === idx) {
      cell.classList.add('seat-selected');
    }

    cell.addEventListener('click', function() {
      onSeatClick(idx);
    });

    grid.appendChild(cell);
  });

  // 教室のうしろ
  var back = document.createElement('div');
  back.className = 'grid-caption grid-caption-center';
  back.textContent = '教室のうしろ';
  grid.appendChild(back);
}

// 席の手動入れ替え
function onSeatClick(clickedIdx) {
  if (selectedSeatIdx === null) {
    selectedSeatIdx = clickedIdx;
    renderClassroom();
    return;
  }
  if (selectedSeatIdx === clickedIdx) {
    selectedSeatIdx = null;
    renderClassroom();
    return;
  }

  var idx1 = selectedSeatIdx;
  var idx2 = clickedIdx;

  var tempSeats = [].concat(currentSeatsResult);
  var tmp = tempSeats[idx1];
  tempSeats[idx1] = tempSeats[idx2];
  tempSeats[idx2] = tmp;

  var conds = collectConditions();
  var alerts = [];

  // 入れ替え検証
  if (!checkNgPairs(tempSeats, currentCols, conds.ng)) {
    alerts.push('「隣同士NG」の指定に違反するペアができてしまいます。');
  }

  for (var i = 0; i < tempSeats.length; i++) {
    var st = tempSeats[i];
    if (!st) continue;
    var r = Math.floor(i / currentCols) + 1;
    var c = (i % currentCols) + 1;

    for (var f = 0; f < conds.front.length; f++) {
      if (conds.front[f].id === st.id && r > conds.front[f].maxRow) {
        alerts.push(st.id + '番の生徒が、指定された前列より後ろになってしまいます。');
      }
    }
    for (var fx = 0; fx < conds.fixed.length; fx++) {
      if (conds.fixed[fx].id === st.id && (conds.fixed[fx].row !== r || conds.fixed[fx].col !== c)) {
        alerts.push(st.id + '番の生徒が、指定した固定席からズレてしまいます。');
      }
    }
    if (conds.genderRule === 'columns') {
      var rule = conds.colGenders[c];
      if (rule === 'male' && st.gender !== 'male') alerts.push(c + '列目に女子が入ってしまいます。');
      if (rule === 'female' && st.gender !== 'female') alerts.push(c + '列目に男子が入ってしまいます。');
    }
  }

  if (alerts.length > 0) {
    var unique = alerts.filter(function(x, i, self) { return self.indexOf(x) === i; });
    var ok = confirm('⚠️条件エラー:\n' + unique.join('\n') + '\n\n本当にこのまま入れ替えますか？');
    if (!ok) {
      selectedSeatIdx = null;
      renderClassroom();
      return;
    }
  }

  currentSeatsResult = tempSeats;
  selectedSeatIdx = null;
  renderClassroom();
}

// クリップボードへのコピー（シェア機能）
function onClickShare() {
  var dummy = document.createElement('textarea');
  document.body.appendChild(dummy);
  dummy.value = window.location.href;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);
  alert('📋 アプリのURLをクリップボードにコピーしました！メールやLINEに貼り付けて他の先生に送れます。');
}

// やり直し機能
function onClickRetry() {
  onClickRunShuffle();
}
