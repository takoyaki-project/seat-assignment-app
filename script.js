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

  // デモデータ等で既にstudentsが入っていない場合のみ、新規で男子を生成
  if (students.length !== count) {
    students = [];
    for (var i = 1; i <= count; i++) {
      students.push({ id: i, gender: 'male' });
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

  var config = JSON.parse(dataStr);
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
    label.textContent = c + '列目';
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
  } else if (type === 'fixed') {
    html += '<input type="number" class="val-fixed-id" placeholder="番号" /> 番の子を ';
    html += '<input type="number" class="val-fixed-r" placeholder="行" />行目の ';
    html += '<input type="number" class="val-fixed-c" placeholder="列" />列目に指定';
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
    fixed: [],
    front: [],
    genderRule: checkedRadio ? checkedRadio.value : 'mixed',
    colGenders: {}
  };

  var itemsNg = document.querySelectorAll('#list-ng .condition-item');
  itemsNg.forEach(function(item) {
    var id1 = parseInt(item.querySelector('.val-ng-1').value);
    var id2 = parseInt(item.querySelector('.val-ng-2').value);
    if (id1 && id2) conds.ng.push([id1, id2]);
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

function onClickRunShuffle() {
  var inpRows = document.getElementById('inp-rows');
  var inpCols = document.getElementById('inp-cols');
  currentRows = parseInt(inpRows.value) || 0;
  currentCols = parseInt(inpCols.value) || 0;

  var conds = collectConditions();
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

    for (var fr = 0; fr < cond.front.length; fr++) {
      if (cond.front[fr].id === targetSt.id && fx.row > cond.front[fr].maxRow) return null;
    }

    seats[seatIdx] = targetSt;
    unplacedStudents.splice(targetStIdx, 1);
  }

  // 2. 残りの生徒のランダムシャッフル
  for (var k = unplacedStudents.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var tmp = unplacedStudents[k];
    unplacedStudents[k] = unplacedStudents[j];
    unplacedStudents[j] = tmp;
  }

  // 席を前から順番に埋めてしていく
  for (var idx = 0; idx < totalSeatsCount; idx++) {
    if (seats[idx] !== null) continue;
    if (unplacedStudents.length === 0) break;

    var currentRowNum = Math.floor(idx / cols) + 1;
    var currentColNum = (idx % cols) + 1;
    var currentStudent = unplacedStudents[0];

    if (cond.genderRule === 'columns') {
      var rule = cond.colGenders[currentColNum];
      if (rule === 'male' && currentStudent.gender !== 'male') continue;
      if (rule === 'female' && currentStudent.gender !== 'female') continue;
    }

    var isFrontOk = true;
    for (var f2 = 0; f2 < cond.front.length; f2++) {
      if (cond.front[f2].id === currentStudent.id && currentRowNum > cond.front[f2].maxRow) {
        isFrontOk = false;
        break;
      }
    }
    if (!isFrontOk) continue;

    seats[idx] = currentStudent;
    unplacedStudents.shift();
  }

  if (unplacedStudents.length > 0) return null;

  // 3. 隣NGルール検証
  if (!checkNgPairs(seats, cols, cond.ng)) return null;

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

// 結果画面（座席）のレンダリング
function renderClassroom() {
  var grid = document.getElementById('classroom-grid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = 'repeat(' + currentCols + ', 1fr)';

  currentSeatsResult.forEach(function(st, idx) {
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
