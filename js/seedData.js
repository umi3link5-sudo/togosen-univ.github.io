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
    "content": "## 統合戦略攻略アーカイブ カスタム表記リファレンス\n\n本ドキュメントは、管理者ダッシュボード（CMS）でのみ表示・プレビュー可能な下書き記事です。攻略記事をより直感的かつ美しく執筆するためのカスタムMarkdownコンポーネントの使用方法をまとめています。\n<br>\n### 1. カスタムバッジ \nバッジを使用して、難易度、オペレーター推奨度、対象テーマをグラフィカルに明示します。\n\n*  [badge: 難易度15 | danger]\n*  [badge: 推奨昇進2 | warning]\n*  [badge: サーミ | info] \n*  [badge: 常設化 | success] \n*  [badge: 臨時契約 | primary] \n<br>\n\n### 2. 推奨オペレーターカードグリッド\n複数のおすすめオペレーターや戦術をグリッド（並列カード）で並めて表示します。\n\n[card-grid]\n[card: ムリナール | スキル3「潮汐をも穿つ光」による圧倒的広範囲・高火力物理ダメージ。分隊の中核。 | 優先度: 極めて高]\n[card: ケルシー | モンスターによる確定ダメージで、高防御力・高術耐性のボスをも容易に突破。 | 優先度: 高]\n[card: テキサス (異格) | スキル2・3の差し込み術ダメージとスタンによる臨機応変な妨害。 | 優先度: 極めて高]\n[/card-grid]\n<br>\n\n### 3. 攻略ステップリスト \nタイムラインや配置順序をステップ形式で可視化します。\n\n[steps]\n[step: 序盤：コスト回収と布陣準備]\n先鋒（イネス、テンニンカ等）を配置し、敵をブロックしつつ後半の主力配置に必要な配置コストを稼ぎます。\n[/step]\n[step: 中盤：高台火力と回復の展開]\n高台に術師や狙撃（ティフォン等）を配置し、さらに医療オペレーターを置いて布陣の維持を図ります。\n[/step]\n[step: 終盤：決戦スキルの発動と防衛]\nボスの出現に合わせて重装で足止めし、アタッカーの決戦スキルを一斉に発動してボスを撃破します。\n[/step]\n[/steps]\n<br>\n\n### 4. 拡張アラートボックス (GitHubスタイル)\n特別な注意書きやアドバイスを、スタイル付きのボックスで強調します。(プレビューには反映されないため注意)\n\n> [!NOTE]\n> 通常の解説やバフに関するメモ書きです。\n\n> [!TIP]\n> 攻略効率を上げるためのテクニックや代替案です。\n\n> [!IMPORTANT]\n> 攻略を進める上で、絶対に避けては通れない必須要件です.",
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

export const INITIAL_TOURNAMENTS = [
  {
    "id": "draft-first-cup",
    "seriesId": "sami",
    "title": "【下書き】第一回 TOGOSEN サーミ極限杯",
    "title_en": "[Draft] 1st TOGOSEN Sami Extreme Cup",
    "status": "draft",
    "date": "2026-07-15",
    "archiveUrl": "https://youtu.be/BZx3tykdQng?si=uUjqDEzdqv0rYWNH",
    "participants": ["Dr. Texas", "Dr. Amiya", "Dr. Kal'tsit"],
    "rules": "### 1. 基本レギュレーション\n本大会はアークナイツ統合戦略「探索者と銀氷の果て」を舞台とした、極限状況での攻略速度およびスコアを競うタイムアタックイベントです。\n<br>\n\n### 2. 特殊ルール・制限事項\n[badge: 難易度15 | danger]\n[badge: 特殊分隊限定 | primary]\n\n[card-grid]\n[card: オペレーター制限 | ★6オペレーターは各昇進段階で最大3名まで編成可能。★4・★5は制限なし。 | 難易度: 高]\n[card: 招集制限 | 「戦闘勝利時」または「緊急作戦」でのみ、新規オペレーターを招集可能。 | 難易度: 極めて高]\n[card: 特殊戦闘 | 5層ボス戦において、特定の初期配置制限ルールを適用。 | 難易度: 中]\n[/card-grid]\n<br>\n\n### 3. 攻略手順の流れ\n[steps]\n[step: 予選フェーズ]\n第3層ボスを撃破した時点での「編成オペレーター数」と「残り耐久値」をもとに暫定スコアを算出します。\n[/step]\n[step: 本選フェーズ]\n予選通過者による第5層ボス「『氷原の意志』」のタイムアタックを行います。\n[/step]\n[step: 決勝フェーズ]\n進水点を1点も失うことなく、かつ特定の秘宝を所持した状態での最速クリアを目指します。\n[/step]\n[/steps]\n\n> [!IMPORTANT]\n> 配信中に通信切断が発生した場合、再接続は1回のみ認められます。2回目以降はリタイア扱いとなりますのでご注意ください。",
    "rules_en": "### 1. Basic Regulation\nThis tournament is a time attack event competing for speed and score in Arknights Integrated Strategies \"Sami\".\n<br>\n\n### 2. Special Rules & Restrictions\n[badge: Difficulty 15 | danger]\n[badge: Special Squad Only | primary]\n\n[card-grid]\n[card: Operator Restrictions | Max 3 6-star operators can be recruited at each promotion stage. | Difficulty: High]\n[card: Recruitment Restrictions | New operators can only be recruited after combat victories. | Difficulty: Very High]\n[card: Boss Battle | Special deployment limits apply during the 5th floor boss battle. | Difficulty: Medium]\n[/card-grid]\n<br>\n\n### 3. Tournament Flow\n[steps]\n[step: Qualifiers]\nCalculate provisional scores based on recruited operators and remaining Life Points after beating the 3rd floor boss.\n[/step]\n[step: Semifinals]\nA time attack challenge against the 5th floor boss for the top qualifiers.\n[/step]\n[step: Finals]\nFastest run to defeat the boss without losing a single Life Point while holding specific collectibles.\n[/step]\n[/steps]\n\n> [!IMPORTANT]\n> If a disconnection occurs during the stream, only one reconnection attempt is allowed. Subsequent disconnections will result in disqualification.",
    "results": "### 最終順位・リザルト\n激闘の末、第一回 TOGOSEN サーミ極限杯の覇者が決定いたしました。\n\n| 順位 | ドクター名 | 使用分隊 | クリアタイム | 最終スコア | 備考 |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| 👑 1位 | Dr. Texas | 特殊分隊 | 24分15秒 | 3,850 | 5層裏ボス撃破 |\n| 🥈 2位 | Dr. Amiya | 破壊分隊 | 26分40秒 | 3,620 | 5層表ボス撃破 |\n| 🥉 3位 | Dr. Kal'tsit | 支援分隊 | 29分10秒 | 3,410 | 5層表ボス撃破 |\n\n<br>\n\n### 大会総評\n[badge: 優勝: Dr. Texas | success]\n[badge: 最多撃破: Dr. Amiya | info]\n\n[card-grid]\n[card: 優勝戦術の分析 | Dr. Texasは「昇進2ムリナール」と「テキサス(異格)」を中心とした高速再配置ループを使用し、ボスの進行を完全にコントロールしました。 | MVP: テキサス(異格)]\n[card: 準優勝戦術の分析 | Dr. Amiyaは強力な術火力でボスを一瞬で溶かす速攻戦術を採用。道中の安定感は抜群でした。 | MVP: ティフォン]\n[/card-grid]\n\n> [!TIP]\n> アーカイブ動画では各ドクターの視点カメラと解説付きの盤面分析を視聴可能です。戦術研究にぜひお役立てください。",
    "results_en": "### Final Standings & Results\nAfter a fierce battle, the champion of the 1st TOGOSEN Sami Extreme Cup has been decided.\n\n| Rank | Doctor Name | Squad Used | Clear Time | Final Score | Remarks |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| 👑 1st | Dr. Texas | Special Squad | 24m 15s | 3,850 | Defeated 5th floor hidden boss |\n| 🥈 2nd | Dr. Amiya | Destruction Squad | 26m 40s | 3,620 | Defeated 5th floor boss |\n| 🥉 3rd | Dr. Kal'tsit | Support Squad | 29m 10s | 3,410 | Defeated 5th floor boss |\n\n<br>\n\n### Tournament Review\n[badge: Champion: Dr. Texas | success]\n[badge: Most Kills: Dr. Amiya | info]\n\n[card-grid]\n[card: Champion's Strategy | Dr. Texas utilized a fast-redeploy loop centered around Texas the Omertosa to control the boss movement completely. | MVP: Texas the Omertosa]\n[card: Runner-up's Strategy | Dr. Amiya adopted a burst strategy to melt down the boss instantly with high Arts damage. | MVP: Typhon]\n[/card-grid]\n\n> [!TIP]\n> You can watch each Doctor's POV and detailed analysis in the archived stream. Excellent resource for strategy research!",
    "image": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1280&h=720&fit=crop"
  }
];
