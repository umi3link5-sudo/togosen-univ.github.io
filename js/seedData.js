export const INITIAL_SERIES = [
  {
    "id": "phantom",
    "num": "IS#2",
    "title": "ファントムと緋き貴石",
    "image": "./images/phantom.png"
  },
  {
    "id": "mizuki",
    "num": "IS#3",
    "title": "ミヅキと紺碧の樹",
    "image": "./images/mizuki.png"
  },
  {
    "id": "sami",
    "num": "IS#4",
    "title": "探索者と銀氷の果て",
    "image": "./images/sami.png"
  },
  {
    "id": "sarkaz",
    "num": "IS#5",
    "title": "サルカズの炉辺奇談",
    "image": "./images/sarkaz.png"
  },
  {
    "id": "sui",
    "num": "IS#6",
    "title": "歳の界園志異",
    "image": "./images/sui.png"
  }
];

export const INITIAL_ARTICLES = [
  {
    "id": "draft-custom-tags-guide",
    "seriesId": "phantom",
    "title": "【下書き・管理者限定】カスタムMarkdown表記の使用例とリファレンス",
    "category": "検証記事",
    "tags": [
      "システム",
      "下書き",
      "カスタムタグ"
    ],
    "status": "draft",
    "content": "## 統合戦略攻略アーカイブ カスタム表記リファレンス\n\n本ドキュメントは、管理者ダッシュボード（CMS）でのみ表示・プレビュー可能な下書き記事です。攻略記事をより直感的かつ美しく執筆するためのカスタムMarkdownコンポーネントの使用方法をまとめています。\n<br>\n### 1. カスタムバッジ \nバッジを使用して、難易度、オペレーター推奨度、対象テーマをグラフィカルに明示します。\n\n*  [badge: 難易度15 | danger]\n*  [badge: 推奨昇進2 | warning]\n*  [badge: サーミ | info] \n*  [badge: 常設化 | success] \n*  [badge: 臨時契約 | primary] \n<br>\n\n### 2. 推奨オペレーターカードグリッド\n複数のおすすめオペレーターや戦術をグリッド（並列カード）で並めて表示します。\n\n[card-grid]\n[card: ムリナール | スキル3「潮汐をも穿つ光」による圧倒的広範囲・高火力物理ダメージ。分隊の中核。 | 優先度: 極めて高]\n[card: ケルシー | モンスターによる確定ダメージで、高防御力・高術耐性のボスをも容易に突破。 | 優先度: 高]\n[card: テキサス (異格) | スキル2・3の差し込み術ダメージとスタンによる臨機応変な妨害。 | 優先度: 極めて高]\n[/card-grid]\n<br>\n\n### 3. 攻略ステップリスト \nタイムラインや配置順序をステップ形式で可視化します。\n\n[steps]\n[step: 序盤：コスト回収と布陣準備]\n先鋒（イネス、テンニンカ等）を配置し、敵をブロックしつつ後半の主力配置に必要な配置コストを稼ぎます。\n[/step]\n[step: 中盤：高台火力と回復の展開]\n高台に術師や狙撃（ティフォン等）を配置し、さらに医療オペレーターを置いて布陣の維持を図ります。\n[/step]\n[step: 終盤：決戦スキルの発動と防衛]\nボスの出現に合わせて重装で足止めし、アタッカーの決戦スキルを一斉に発動してボスを撃破します。\n[/step]\n[/steps]\n<br>\n\n### 4. 拡張アラートボックス (GitHubスタイル)\n特別な注意書きやアドバイスを、スタイル付きのボックスで強調します。(プレビューには反映されないため注意)\n\n> [!NOTE]\n> 通常の解説やバフに関するメモ書きです。\n\n> [!TIP]\n> 攻略効率を上げるためのテクニックや代替案です。\n\n> [!IMPORTANT]\n> 攻略を進める上で、絶対に避けては通れない必須要件です。",
    "createdAt": "2026-06-26T04:00:00Z",
    "updatedAt": "2026-06-25T19:50:08.231Z",
    "history": []
  }
];

export const INITIAL_VIDEOS = [
  {
    "id": "v_1782416507942",
    "title": "【アークナイツ】Mon3tr跳船攻略解説【サルカズの炉辺奇談】",
    "seriesId": "sarkaz",
    "articleId": "",
    "youtubeUrl": "https://youtu.be/BZx3tykdQng?si=uUjqDEzdqv0rYWNH",
    "publishedAt": "2026-04-10",
    "summary": "説法戦におけるMon3trのテクニックの解説動画です"
  }
];

export const INITIAL_TOURNAMENTS = [];
