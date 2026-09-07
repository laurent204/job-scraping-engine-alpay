import type { Module, Word } from './types'
import { A2_MODULES } from './content2'

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */
const w = (
  id: string,
  ca: string,
  fr: string,
  phon: string,
  emoji: string,
  extra?: Partial<Pick<Word, 'note' | 'ex'>>,
): Word => ({ id, ca, fr, phon, emoji, ...extra })

/* ------------------------------------------------------------------ */
/* Module 1 — Hola!  (salutations & politesse)                         */
/* ------------------------------------------------------------------ */
const m1: Module = {
  id: 'hola',
  title: 'Premiers mots',
  titleCa: 'Hola!',
  color: 'sol',
  emblem: 'sun',
  description: 'Saluer, remercier, se présenter',
  tidbits: [
    'Le catalan est parlé par plus de 9 millions de personnes, en Catalogne, à Valence, aux Baléares… et jusqu’à Perpignan !',
    '« Bon dia » s’utilise le matin, « bona tarda » l’après-midi et « bona nit » le soir — comme en français, mais en plus précis.',
    'Environ 70 % du vocabulaire catalan est transparent depuis le français. Tu pars avec une longueur d’avance.',
  ],
  lessons: [
    {
      id: 'hola-1',
      title: 'Dire bonjour',
      titleCa: 'Dir hola',
      kind: 'words',
      words: [
        w('hola', 'Hola', 'Salut / Bonjour', 'O-la', '👋', {
          note: 'Le « h » est muet, comme en français.',
          ex: { ca: 'Hola, bon dia!', fr: 'Salut, bonjour !' },
        }),
        w('bon-dia', 'Bon dia', 'Bonjour (le matin)', 'bonn DI-eu', '🌅', {
          ex: { ca: 'Bon dia a tothom!', fr: 'Bonjour à tous !' },
        }),
        w('bona-tarda', 'Bona tarda', 'Bonjour (l’après-midi)', 'BO-neu TAR-deu', '☀️'),
        w('bona-nit', 'Bona nit', 'Bonsoir / Bonne nuit', 'BO-neu NITT', '🌙', {
          ex: { ca: 'Bona nit i bons somnis!', fr: 'Bonne nuit et fais de beaux rêves !' },
        }),
        w('adeu', 'Adéu', 'Au revoir', 'a-DÉ-ou', '👋', {
          ex: { ca: 'Adéu, fins aviat!', fr: 'Au revoir, à bientôt !' },
        }),
        w('fins-aviat', 'Fins aviat', 'À bientôt', 'finz eu-vi-ATT', '🤝'),
        w('fins-dema', 'Fins demà', 'À demain', 'finz deu-MA', '📅'),
        w('benvingut', 'Benvingut', 'Bienvenue', 'bèn-vin-GOUTT', '🚪', {
          note: 'On dit « benvinguda » à une femme.',
        }),
      ],
    },
    {
      id: 'hola-2',
      title: 'La politesse',
      titleCa: 'Ser educat',
      kind: 'words',
      words: [
        w('sisplau', 'Si us plau', 'S’il vous plaît', 'si ous PLAOU', '🙏', {
          note: 'Littéralement « si cela vous plaît » — comme en français !',
          ex: { ca: 'Una aigua, si us plau.', fr: 'Une eau, s’il vous plaît.' },
        }),
        w('gracies', 'Gràcies', 'Merci', 'GRA-si-euss', '💛', {
          ex: { ca: 'Moltes gràcies!', fr: 'Merci beaucoup !' },
        }),
        w('moltes-gracies', 'Moltes gràcies', 'Merci beaucoup', 'MOL-teuss GRA-si-euss', '💐'),
        w('de-res', 'De res', 'De rien', 'deu RESS', '😊'),
        w('perdo', 'Perdó', 'Pardon', 'peur-DO', '🫣'),
        w('ho-sento', 'Ho sento', 'Je suis désolé(e)', 'ou SÈN-tou', '😔', {
          note: 'Littéralement « je le sens ».',
        }),
        w('disculpi', 'Disculpi', 'Excusez-moi', 'diss-COUL-pi', '🙋', {
          note: 'Pour aborder quelqu’un poliment (vouvoiement).',
        }),
        w('dacord', 'D’acord', 'D’accord', 'da-CORT', '👌'),
      ],
    },
    {
      id: 'hola-3',
      title: 'Se présenter',
      titleCa: 'Com estàs?',
      kind: 'words',
      words: [
        w('com-estas', 'Com estàs?', 'Comment vas-tu ?', 'comm euss-TASS', '💬', {
          ex: { ca: 'Hola! Com estàs?', fr: 'Salut ! Comment vas-tu ?' },
        }),
        w('molt-be', 'Molt bé', 'Très bien', 'moll BÉ', '✨', {
          ex: { ca: 'Molt bé, gràcies!', fr: 'Très bien, merci !' },
        }),
        w('i-tu', 'I tu?', 'Et toi ?', 'i TOU', '🔁'),
        w('em-dic', 'Em dic…', 'Je m’appelle…', 'eumm DIC', '🏷️', {
          ex: { ca: 'Em dic Laurent.', fr: 'Je m’appelle Laurent.' },
        }),
        w('com-et-dius', 'Com et dius?', 'Comment tu t’appelles ?', 'comm eut DI-ouss', '❓'),
        w('encantat', 'Encantat', 'Enchanté', 'eun-can-TATT', '🤝', {
          note: '« Encantada » si c’est une femme qui parle.',
        }),
        w('soc-frances', 'Soc francès', 'Je suis français', 'soc freun-SÈSS', '🇫🇷', {
          note: '« Soc francesa » au féminin.',
        }),
        w('parlo-una-mica', 'Parlo una mica', 'Je parle un peu', 'PAR-lou OU-neu MI-keu', '🌱', {
          ex: { ca: 'Parlo una mica de català.', fr: 'Je parle un peu catalan.' },
        }),
      ],
    },
    {
      id: 'hola-dialogue',
      title: 'Première rencontre',
      titleCa: 'La conversa',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Núria',
        npcEmoji: '👩🏻‍🦱',
        scene: 'Sur une place de Gràcia, une voisine te salue.',
        turns: [
          { kind: 'npc', ca: 'Hola, bon dia!', fr: 'Salut, bonjour !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Bon dia!', fr: 'Bonjour !', ok: true },
              { ca: 'Bona nit!', fr: 'Bonne nuit !', ok: false },
              { ca: 'Adéu!', fr: 'Au revoir !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Com et dius?', fr: 'Comment tu t’appelles ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Molt bé, gràcies.', fr: 'Très bien, merci.', ok: false },
              { ca: 'Em dic Laurent.', fr: 'Je m’appelle Laurent.', ok: true },
              { ca: 'De res!', fr: 'De rien !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Encantada! Com estàs?', fr: 'Enchantée ! Comment vas-tu ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Molt bé, i tu?', fr: 'Très bien, et toi ?', ok: true },
              { ca: 'Fins demà!', fr: 'À demain !', ok: false },
              { ca: 'Si us plau.', fr: 'S’il vous plaît.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Molt bé! Parles català?', fr: 'Très bien ! Tu parles catalan ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Parlo una mica.', fr: 'Je parle un peu.', ok: true },
              { ca: 'Bona tarda.', fr: 'Bon après-midi.', ok: false },
              { ca: 'Ho sento.', fr: 'Je suis désolé.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Fantàstic! Adéu, fins aviat!', fr: 'Fantastique ! Au revoir, à bientôt !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Adéu, fins aviat!', fr: 'Au revoir, à bientôt !', ok: true },
              { ca: 'Benvingut!', fr: 'Bienvenue !', ok: false },
              { ca: 'Perdó!', fr: 'Pardon !', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 2 — Els nombres  (compter)                                   */
/* ------------------------------------------------------------------ */
const m2: Module = {
  id: 'nombres',
  title: 'Compter',
  titleCa: 'Els nombres',
  color: 'mar',
  emblem: 'numbers',
  description: 'De 1 à 100, les prix, les quantités',
  tidbits: [
    'En catalan, le « v » se prononce souvent comme un « b » : « vuit » (huit) sonne comme « bouit ».',
    'Pour lier les dizaines : « vint-i-dos » (22), « trenta-quatre » (34). Le petit « i » veut dire « et ».',
    'Les prix se disent avec « amb » : « tres euros amb cinquanta » = 3,50 €.',
  ],
  lessons: [
    {
      id: 'nombres-1',
      title: 'De 1 à 10',
      titleCa: "D'u a deu",
      kind: 'words',
      words: [
        w('u', 'U', 'Un (1)', 'OU', '1️⃣', { note: 'Devant un nom, on dit « un » : un cafè.' }),
        w('dos', 'Dos', 'Deux (2)', 'DOSS', '2️⃣', { note: '« Dues » au féminin : dues taules.' }),
        w('tres', 'Tres', 'Trois (3)', 'TRÈSS', '3️⃣'),
        w('quatre', 'Quatre', 'Quatre (4)', 'QOUA-treu', '4️⃣'),
        w('cinc', 'Cinc', 'Cinq (5)', 'SINC', '5️⃣'),
        w('sis', 'Sis', 'Six (6)', 'SISS', '6️⃣'),
        w('set', 'Set', 'Sept (7)', 'SÈTT', '7️⃣'),
        w('vuit', 'Vuit', 'Huit (8)', 'BOU-itt', '8️⃣', { note: 'Le « v » se prononce presque « b ».' }),
        w('nou', 'Nou', 'Neuf (9)', 'NO-ou', '9️⃣', { note: '« Nou » veut aussi dire « nouveau » !' }),
        w('deu', 'Deu', 'Dix (10)', 'DÈ-ou', '🔟'),
      ],
    },
    {
      id: 'nombres-2',
      title: 'De 11 à 20',
      titleCa: "D'onze a vint",
      kind: 'words',
      words: [
        w('onze', 'Onze', 'Onze (11)', 'ON-zeu', '🕚'),
        w('dotze', 'Dotze', 'Douze (12)', 'DOD-zeu', '🕛'),
        w('tretze', 'Tretze', 'Treize (13)', 'TRÈD-zeu', '🎂'),
        w('catorze', 'Catorze', 'Quatorze (14)', 'ca-TOR-zeu', '📆'),
        w('quinze', 'Quinze', 'Quinze (15)', 'KIN-zeu', '🎾'),
        w('setze', 'Setze', 'Seize (16)', 'SÈD-zeu', '🎈'),
        w('disset', 'Disset', 'Dix-sept (17)', 'di-SÈTT', '🎟️'),
        w('divuit', 'Divuit', 'Dix-huit (18)', 'di-BOU-itt', '🎓'),
        w('dinou', 'Dinou', 'Dix-neuf (19)', 'di-NO-ou', '🧁'),
        w('vint', 'Vint', 'Vingt (20)', 'BINN', '🍇'),
      ],
    },
    {
      id: 'nombres-3',
      title: 'Dizaines & prix',
      titleCa: 'Desenes i preus',
      kind: 'words',
      words: [
        w('trenta', 'Trenta', 'Trente (30)', 'TRÈN-teu', '🌡️'),
        w('quaranta', 'Quaranta', 'Quarante (40)', 'qoua-RAN-teu', '🏁'),
        w('cinquanta', 'Cinquanta', 'Cinquante (50)', 'sin-QOUAN-teu', '💿'),
        w('cent', 'Cent', 'Cent (100)', 'SÈNN', '💯'),
        w('mig', 'Mig', 'Demi', 'MITCH', '🌗', {
          ex: { ca: 'Mig quilo, si us plau.', fr: 'Un demi-kilo, s’il vous plaît.' },
        }),
        w('quant-val', 'Quant val?', 'Combien ça vaut ?', 'qouann BALL', '🤔', {
          ex: { ca: 'Quant val això?', fr: 'Combien ça vaut, ça ?' },
        }),
        w('son-tres-euros', 'Són tres euros', 'Ça fait trois euros', 'sonn trèss É-ou-ross', '💶'),
        w('els-euros', "L'euro", 'L’euro', 'LÉ-ou-rou', '🪙', {
          note: 'Pluriel : els euros. 3,50 € = « tres euros amb cinquanta ».',
        }),
      ],
    },
    {
      id: 'nombres-dialogue',
      title: 'Au kiosque',
      titleCa: 'Al quiosc',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Jordi',
        npcEmoji: '👨🏻‍💼',
        scene: 'Tu achètes deux cartes postales à un kiosque des Rambles.',
        turns: [
          { kind: 'npc', ca: 'Bon dia! Què vols?', fr: 'Bonjour ! Qu’est-ce que tu veux ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Dues postals, si us plau.', fr: 'Deux cartes postales, s’il vous plaît.', ok: true },
              { ca: 'Bona nit!', fr: 'Bonne nuit !', ok: false },
              { ca: 'Em dic Laurent.', fr: 'Je m’appelle Laurent.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Molt bé. Alguna cosa més?', fr: 'Très bien. Autre chose ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'No, gràcies. Quant val?', fr: 'Non, merci. Combien ça vaut ?', ok: true },
              { ca: 'Sí, adéu!', fr: 'Oui, au revoir !', ok: false },
              { ca: 'Fins demà!', fr: 'À demain !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Són quatre euros amb cinquanta.', fr: 'Ça fait quatre euros cinquante.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Aquí té cinc euros.', fr: 'Voici cinq euros.', ok: true },
              { ca: 'Són vuit euros.', fr: 'Ça fait huit euros.', ok: false },
              { ca: 'Ho sento!', fr: 'Je suis désolé !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'I cinquanta cèntims de canvi. Gràcies!', fr: 'Et cinquante centimes de monnaie. Merci !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Gràcies, adéu!', fr: 'Merci, au revoir !', ok: true },
              { ca: 'Quant val?', fr: 'Combien ça vaut ?', ok: false },
              { ca: 'Benvingut!', fr: 'Bienvenue !', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 3 — Al restaurant                                            */
/* ------------------------------------------------------------------ */
const m3: Module = {
  id: 'restaurant',
  title: 'Au restaurant',
  titleCa: 'Al restaurant',
  color: 'terra',
  emblem: 'food',
  description: 'Réserver, commander, payer',
  tidbits: [
    'En catalan, le vin rouge est… noir : « vi negre » ! 🍷',
    'Le « pa amb tomàquet » (pain frotté à la tomate, huile d’olive et sel) est LE plat emblème de la Catalogne.',
    'Avant de manger, on lance un joyeux « Bon profit ! » — bon appétit !',
  ],
  lessons: [
    {
      id: 'rest-1',
      title: 'Arriver & s’installer',
      titleCa: 'Arribar',
      kind: 'words',
      words: [
        w('taula-per-dos', 'Una taula per a dos', 'Une table pour deux', 'OU-neu TAOU-leu peur a DOSS', '🪑', {
          ex: { ca: 'Una taula per a dos, si us plau.', fr: 'Une table pour deux, s’il vous plaît.' },
        }),
        w('la-carta', 'La carta', 'La carte / le menu', 'la CAR-teu', '📖', {
          ex: { ca: 'La carta, si us plau.', fr: 'La carte, s’il vous plaît.' },
        }),
        w('el-cambrer', 'El cambrer', 'Le serveur', 'eul cam-BRÉ', '🤵', {
          note: 'La serveuse : « la cambrera ».',
        }),
        w('esmorzar', 'Esmorzar', 'Le petit-déjeuner', 'euss-mour-ZA', '🥐'),
        w('dinar', 'Dinar', 'Le déjeuner', 'di-NA', '🍽️', {
          note: 'Attention au faux ami : « dinar » = déjeuner, pas dîner !',
        }),
        w('sopar', 'Sopar', 'Le dîner', 'sou-PA', '🌆'),
        w('tinc-gana', 'Tinc gana', 'J’ai faim', 'tinc GA-neu', '😋', {
          ex: { ca: 'Tinc molta gana!', fr: 'J’ai très faim !' },
        }),
        w('tinc-set', 'Tinc set', 'J’ai soif', 'tinc SÈTT', '🥤'),
      ],
    },
    {
      id: 'rest-2',
      title: 'Commander',
      titleCa: 'Demanar',
      kind: 'words',
      words: [
        w('voldria', 'Voldria…', 'Je voudrais…', 'boul-DRI-eu', '🙋', {
          note: 'Le mot magique pour tout commander poliment.',
          ex: { ca: 'Voldria una cervesa.', fr: 'Je voudrais une bière.' },
        }),
        w('aigua', "L'aigua", 'L’eau', 'LAÏ-goua', '💧', {
          ex: { ca: 'Una aigua amb gas.', fr: 'Une eau gazeuse.' },
        }),
        w('vi-negre', 'El vi negre', 'Le vin rouge', 'eul BI NÈ-greu', '🍷', {
          note: 'Littéralement « vin noir » !',
        }),
        w('cervesa', 'La cervesa', 'La bière', 'la seur-BÈ-zeu', '🍺'),
        w('pa-amb-tomaquet', 'Pa amb tomàquet', 'Pain à la tomate', 'PA amm tou-MA-keutt', '🍅', {
          note: 'L’emblème de la cuisine catalane.',
        }),
        w('les-postres', 'Les postres', 'Le dessert', 'leuss POSS-treuss', '🍮', {
          ex: { ca: 'De postres, crema catalana.', fr: 'En dessert, une crème catalane.' },
        }),
        w('que-em-recomana', 'Què em recomana?', 'Que me conseillez-vous ?', 'kè eumm reu-cou-MA-neu', '🧑‍🍳'),
        w('bon-profit', 'Bon profit!', 'Bon appétit !', 'bonn prou-FITT', '🥂'),
      ],
    },
    {
      id: 'rest-3',
      title: 'Payer & remercier',
      titleCa: 'Pagar',
      kind: 'words',
      words: [
        w('el-compte', 'El compte', 'L’addition', 'eul COMP-teu', '🧾', {
          ex: { ca: 'El compte, si us plau.', fr: 'L’addition, s’il vous plaît.' },
        }),
        w('amb-targeta', 'Amb targeta', 'Par carte', 'amm tar-JÈ-teu', '💳', {
          ex: { ca: 'Puc pagar amb targeta?', fr: 'Je peux payer par carte ?' },
        }),
        w('en-efectiu', 'En efectiu', 'En espèces', 'eun eu-fec-TI-ou', '💵'),
        w('bonissim', 'Boníssim!', 'Délicieux !', 'bou-NI-simm', '🤤', {
          ex: { ca: 'Està boníssim!', fr: 'C’est délicieux !' },
        }),
        w('el-lavabo', 'El lavabo', 'Les toilettes', 'eul la-BA-bou', '🚻', {
          ex: { ca: 'On és el lavabo?', fr: 'Où sont les toilettes ?' },
        }),
        w('la-propina', 'La propina', 'Le pourboire', 'la prou-PI-neu', '🪙'),
        w('molt-bo', 'Molt bo', 'Très bon', 'moll BOU', '👨‍🍳', {
          note: '« Molt bona » au féminin : la crema és molt bona.',
        }),
        w('res-mes', 'Res més', 'Rien d’autre', 'rèss MÉSS', '✅', {
          ex: { ca: 'Res més, gràcies.', fr: 'Rien d’autre, merci.' },
        }),
      ],
    },
    {
      id: 'rest-dialogue',
      title: 'Dîner à Barcelone',
      titleCa: 'El sopar',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Marc, el cambrer',
        npcEmoji: '🤵🏻',
        scene: 'Un petit restaurant du Born, vendredi soir. Le serveur s’approche.',
        turns: [
          { kind: 'npc', ca: 'Bona nit! Què voleu?', fr: 'Bonsoir ! Que voulez-vous ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Una taula per a dos, si us plau.', fr: 'Une table pour deux, s’il vous plaît.', ok: true },
              { ca: 'El compte, si us plau.', fr: 'L’addition, s’il vous plaît.', ok: false },
              { ca: 'Bon profit!', fr: 'Bon appétit !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Perfecte, aquí teniu. La carta.', fr: 'Parfait, voilà pour vous. La carte.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Gràcies! Què em recomana?', fr: 'Merci ! Que me conseillez-vous ?', ok: true },
              { ca: 'Adéu!', fr: 'Au revoir !', ok: false },
              { ca: 'Tinc set de postres.', fr: 'J’ai soif de dessert.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'El pa amb tomàquet és boníssim!', fr: 'Le pain à la tomate est délicieux !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Voldria pa amb tomàquet i vi negre.', fr: 'Je voudrais du pain à la tomate et du vin rouge.', ok: true },
              { ca: 'On és el lavabo? Adéu!', fr: 'Où sont les toilettes ? Au revoir !', ok: false },
              { ca: 'Una taula per a dos.', fr: 'Une table pour deux.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Molt bé. Bon profit!', fr: 'Très bien. Bon appétit !' },
          { kind: 'npc', ca: '… Com està tot?', fr: '… Tout se passe bien ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Està boníssim, gràcies!', fr: 'C’est délicieux, merci !', ok: true },
              { ca: 'Tinc gana.', fr: 'J’ai faim.', ok: false },
              { ca: 'Benvingut!', fr: 'Bienvenue !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Alguna cosa més?', fr: 'Autre chose ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Res més. El compte, si us plau.', fr: 'Rien d’autre. L’addition, s’il vous plaît.', ok: true },
              { ca: 'Sí, una taula per a dos.', fr: 'Oui, une table pour deux.', ok: false },
              { ca: 'Bon dia!', fr: 'Bonjour !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Són vint-i-dos euros.', fr: 'Ça fait vingt-deux euros.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Puc pagar amb targeta?', fr: 'Je peux payer par carte ?', ok: true },
              { ca: 'Quant val la carta?', fr: 'Combien vaut la carte ?', ok: false },
              { ca: 'Tinc set!', fr: 'J’ai soif !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'I tant! Moltes gràcies, bona nit!', fr: 'Bien sûr ! Merci beaucoup, bonne soirée !' },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 4 — Al mercat  (faire ses courses)                           */
/* ------------------------------------------------------------------ */
const m4: Module = {
  id: 'mercat',
  title: 'Faire ses courses',
  titleCa: 'Al mercat',
  color: 'oliva',
  emblem: 'market',
  description: 'Le marché, les quantités, négocier',
  tidbits: [
    'La Boqueria, sur les Rambles de Barcelone, est l’un des plus beaux marchés couverts d’Europe — depuis 1217 !',
    'Au marché, on demande « el torn » : « Qui és l’últim? » (qui est le dernier ?) pour prendre son tour dans la file.',
    '« Un parell » = une paire, mais en catalan familier ça veut souvent juste dire « deux ou trois ».',
  ],
  lessons: [
    {
      id: 'mercat-1',
      title: 'Fruits & légumes',
      titleCa: 'Fruita i verdura',
      kind: 'words',
      words: [
        w('el-mercat', 'El mercat', 'Le marché', 'eul meur-CATT', '🏛️', {
          ex: { ca: 'Vaig al mercat.', fr: 'Je vais au marché.' },
        }),
        w('la-fruita', 'La fruita', 'Les fruits', 'la FROUÏ-teu', '🍎'),
        w('la-verdura', 'La verdura', 'Les légumes', 'la beur-DOU-reu', '🥬'),
        w('una-poma', 'Una poma', 'Une pomme', 'OU-neu PO-meu', '🍏', {
          note: 'Comme « pomme » en vieux français !',
        }),
        w('un-tomaquet', 'Un tomàquet', 'Une tomate', 'oun tou-MA-keutt', '🍅'),
        w('una-taronja', 'Una taronja', 'Une orange', 'OU-neu teu-RON-jeu', '🍊'),
        w('una-maduixa', 'Una maduixa', 'Une fraise', 'OU-neu meu-DOUI-cheu', '🍓', {
          note: 'Le « x » catalan se prononce « ch ».',
        }),
        w('el-raim', 'El raïm', 'Le raisin', 'eul reu-IMM', '🍇'),
      ],
    },
    {
      id: 'mercat-2',
      title: 'À l’étal',
      titleCa: 'A la parada',
      kind: 'words',
      words: [
        w('quant-costa', 'Quant costa?', 'Combien ça coûte ?', 'qouann COSS-teu', '💰', {
          ex: { ca: 'Quant costa el formatge?', fr: 'Combien coûte le fromage ?' },
        }),
        w('un-quilo', 'Un quilo de…', 'Un kilo de…', 'oun KI-lou deu', '⚖️', {
          ex: { ca: 'Un quilo de tomàquets.', fr: 'Un kilo de tomates.' },
        }),
        w('mig-quilo', 'Mig quilo', 'Un demi-kilo', 'mitch KI-lou', '🌗'),
        w('massa-car', 'Massa car', 'Trop cher', 'MA-seu CAR', '😱', {
          note: '« Car / cara » comme « cher / chère ».',
        }),
        w('barat', 'Barat', 'Bon marché', 'beu-RATT', '🤑'),
        w('alguna-cosa-mes', 'Alguna cosa més?', 'Autre chose ?', 'eul-GOU-neu CO-zeu MÉSS', '🛒'),
        w('una-bossa', 'Una bossa', 'Un sac', 'OU-neu BO-seu', '👜'),
        w('molt-fresc', 'Molt fresc', 'Très frais', 'moll FRESSC', '❄️', {
          ex: { ca: 'El peix és molt fresc.', fr: 'Le poisson est très frais.' },
        }),
      ],
    },
    {
      id: 'mercat-3',
      title: 'À l’épicerie',
      titleCa: 'La botiga',
      kind: 'words',
      words: [
        w('la-llet', 'La llet', 'Le lait', 'la LIÈTT', '🥛', {
          note: 'Le « ll » se prononce comme « ill » dans « famille ».',
        }),
        w('el-pa', 'El pa', 'Le pain', 'eul PA', '🥖'),
        w('el-formatge', 'El formatge', 'Le fromage', 'eul four-MAD-jeu', '🧀'),
        w('els-ous', 'Els ous', 'Les œufs', 'eulz O-ouss', '🥚'),
        w('el-peix', 'El peix', 'Le poisson', 'eul PÈCH', '🐟'),
        w('la-carn', 'La carn', 'La viande', 'la CARN', '🥩'),
        w('oli-oliva', "L'oli d'oliva", 'L’huile d’olive', 'LO-li dou-LI-beu', '🫒', {
          note: 'L’or liquide de la Méditerranée.',
        }),
        w('la-xocolata', 'La xocolata', 'Le chocolat', 'la chou-cou-LA-teu', '🍫'),
      ],
    },
    {
      id: 'mercat-dialogue',
      title: 'À la Boqueria',
      titleCa: 'A la parada',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Montse',
        npcEmoji: '👩🏻‍🌾',
        scene: 'Un étal de fruits à la Boqueria. La marchande t’accueille.',
        turns: [
          { kind: 'npc', ca: 'Bon dia! Què vols, maco?', fr: 'Bonjour ! Qu’est-ce que tu veux, mon joli ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Un quilo de taronges, si us plau.', fr: 'Un kilo d’oranges, s’il vous plaît.', ok: true },
              { ca: 'Una taula per a dos.', fr: 'Une table pour deux.', ok: false },
              { ca: 'On és el lavabo?', fr: 'Où sont les toilettes ?', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Molt bé! Són molt fresques. Alguna cosa més?', fr: 'Très bien ! Elles sont très fraîches. Autre chose ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí, mig quilo de maduixes.', fr: 'Oui, un demi-kilo de fraises.', ok: true },
              { ca: 'No, una bossa de bosses.', fr: 'Non, un sac de sacs.', ok: false },
              { ca: 'Bon profit!', fr: 'Bon appétit !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Aquí tens. Res més?', fr: 'Voilà pour toi. Rien d’autre ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Res més. Quant costa?', fr: 'Rien d’autre. Combien ça coûte ?', ok: true },
              { ca: 'Massa car!', fr: 'Trop cher !', ok: false },
              { ca: 'Em dic Laurent.', fr: 'Je m’appelle Laurent.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Són sis euros amb vint.', fr: 'Ça fait six euros vingt.' },
          {
            kind: 'you',
            choices: [
              { ca: 'D’acord. Una bossa, si us plau.', fr: 'D’accord. Un sac, s’il vous plaît.', ok: true },
              { ca: 'Barat! Adéu!', fr: 'Pas cher ! Au revoir !', ok: false },
              { ca: 'Tinc gana!', fr: 'J’ai faim !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'I tant! Gràcies, guapo. Fins aviat!', fr: 'Bien sûr ! Merci, beau gosse. À bientôt !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Gràcies! Fins aviat!', fr: 'Merci ! À bientôt !', ok: true },
              { ca: 'Quant costa?', fr: 'Combien ça coûte ?', ok: false },
              { ca: 'Ho sento.', fr: 'Je suis désolé.', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 5 — Pel carrer  (demander son chemin)                        */
/* ------------------------------------------------------------------ */
const m5: Module = {
  id: 'carrer',
  title: 'Trouver son chemin',
  titleCa: 'Pel carrer',
  color: 'rosa',
  emblem: 'compass',
  description: 'S’orienter, le métro, les lieux',
  tidbits: [
    'À Barcelone, « l’Eixample » (l’extension) est le quartier quadrillé aux coins coupés — pensé par Cerdà en 1859.',
    '« Carrer » vient du latin « carraria », la voie pour les chars. La rue la plus célèbre ? La Rambla, bien sûr.',
    'Le funiculaire et le téléphérique de Montjuïc offrent la plus belle vue sur la ville — « quines vistes! ».',
  ],
  lessons: [
    {
      id: 'carrer-1',
      title: 'Les lieux',
      titleCa: 'On és…?',
      kind: 'words',
      words: [
        w('on-es', 'On és…?', 'Où est… ?', 'onn ÉSS', '📍', {
          ex: { ca: 'On és la platja?', fr: 'Où est la plage ?' },
        }),
        w('el-carrer', 'El carrer', 'La rue', 'eul keu-RÉ', '🛣️'),
        w('la-placa', 'La plaça', 'La place', 'la PLA-seu', '⛲', {
          note: 'Le « ç » existe aussi en catalan !',
        }),
        w('estacio', "L'estació", 'La gare', 'leuss-teu-si-O', '🚉'),
        w('el-metro', 'El metro', 'Le métro', 'eul MÈ-trou', '🚇'),
        w('la-platja', 'La platja', 'La plage', 'la PLAD-jeu', '🏖️'),
        w('el-museu', 'El museu', 'Le musée', 'eul mou-ZÈ-ou', '🖼️'),
        w('a-prop', 'A prop', 'Près / à côté', 'a PROP', '📏', {
          note: 'Le contraire : « lluny » (loin).',
          ex: { ca: 'És a prop d’aquí?', fr: 'C’est près d’ici ?' },
        }),
      ],
    },
    {
      id: 'carrer-2',
      title: 'Les directions',
      titleCa: 'Indicacions',
      kind: 'words',
      words: [
        w('a-la-dreta', 'A la dreta', 'À droite', 'a la DRÈ-teu', '➡️', {
          ex: { ca: 'El museu és a la dreta.', fr: 'Le musée est à droite.' },
        }),
        w('a-lesquerra', "A l'esquerra", 'À gauche', 'a leuss-KÈ-reu', '⬅️'),
        w('tot-recte', 'Tot recte', 'Tout droit', 'tott RÈC-teu', '⬆️', {
          ex: { ca: 'Segueix tot recte.', fr: 'Continue tout droit.' },
        }),
        w('gira', 'Gira', 'Tourne', 'JI-reu', '↩️', {
          ex: { ca: 'Gira a la dreta.', fr: 'Tourne à droite.' },
        }),
        w('la-cantonada', 'La cantonada', 'Le coin de rue', 'la can-tou-NA-deu', '📐'),
        w('el-semafor', 'El semàfor', 'Le feu tricolore', 'eul seu-MA-four', '🚦'),
        w('lluny', 'Lluny', 'Loin', 'LIOUGNE', '🔭'),
        w('aqui', 'Aquí', 'Ici', 'a-KI', '📌', {
          ex: { ca: 'És aquí mateix!', fr: 'C’est juste ici !' },
        }),
      ],
    },
    {
      id: 'carrer-3',
      title: 'Se déplacer',
      titleCa: "Moure's",
      kind: 'words',
      words: [
        w('a-peu', 'A peu', 'À pied', 'a PÈ-ou', '🚶', {
          ex: { ca: 'Hi vaig a peu.', fr: 'J’y vais à pied.' },
        }),
        w('el-bitllet', 'El bitllet', 'Le ticket', 'eul bi-LIÈTT', '🎫'),
        w('la-parada', 'La parada', 'L’arrêt', 'la peu-RA-deu', '🚏', {
          note: 'Aussi « l’étal » au marché — contexte !',
        }),
        w('obert', 'Obert', 'Ouvert', 'ou-BÈRT', '🔓'),
        w('tancat', 'Tancat', 'Fermé', 'teun-CATT', '🔒', {
          ex: { ca: 'El museu està tancat.', fr: 'Le musée est fermé.' },
        }),
        w('entrada', "L'entrada", 'L’entrée', 'leun-TRA-deu', '🚪'),
        w('sortida', 'La sortida', 'La sortie', 'la sour-TI-deu', '🏃', {
          note: 'Tu la verras partout dans le métro !',
        }),
        w('el-mapa', 'El mapa', 'Le plan / la carte', 'eul MA-peu', '🗺️'),
      ],
    },
    {
      id: 'carrer-dialogue',
      title: 'Vers la Sagrada',
      titleCa: 'Cap a la Sagrada',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Pau',
        npcEmoji: '👴🏻',
        scene: 'Perdu dans l’Eixample, tu abordes un passant tranquille.',
        turns: [
          {
            kind: 'you',
            choices: [
              { ca: 'Disculpi! On és la Sagrada Família?', fr: 'Excusez-moi ! Où est la Sagrada Família ?', ok: true },
              { ca: 'Hola! Tinc set!', fr: 'Salut ! J’ai soif !', ok: false },
              { ca: 'El compte, si us plau.', fr: 'L’addition, s’il vous plaît.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'És a prop! Segueix tot recte.', fr: 'C’est tout près ! Continue tout droit.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Tot recte, d’acord. I després?', fr: 'Tout droit, d’accord. Et ensuite ?', ok: true },
              { ca: 'Massa car!', fr: 'Trop cher !', ok: false },
              { ca: 'Bona nit!', fr: 'Bonne nuit !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Al semàfor, gira a l’esquerra.', fr: 'Au feu, tourne à gauche.' },
          {
            kind: 'you',
            choices: [
              { ca: 'A l’esquerra al semàfor. És lluny?', fr: 'À gauche au feu. C’est loin ?', ok: true },
              { ca: 'A la dreta al mercat?', fr: 'À droite au marché ?', ok: false },
              { ca: 'Vull un bitllet.', fr: 'Je veux un ticket.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'No, deu minuts a peu.', fr: 'Non, dix minutes à pied.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Perfecte! Moltes gràcies!', fr: 'Parfait ! Merci beaucoup !', ok: true },
              { ca: 'Deu euros? Massa car!', fr: 'Dix euros ? Trop cher !', ok: false },
              { ca: 'El museu està tancat.', fr: 'Le musée est fermé.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'De res! Que vagi bé!', fr: 'De rien ! Bonne continuation !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Adéu, bon dia!', fr: 'Au revoir, bonne journée !', ok: true },
              { ca: 'Tancat!', fr: 'Fermé !', ok: false },
              { ca: 'Un quilo, si us plau.', fr: 'Un kilo, s’il vous plaît.', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

export const MODULES: Module[] = [m1, m2, m3, m4, m5, ...A2_MODULES]

/** Flat ordered list of every lesson with its module */
export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })))

export const TOTAL_WORDS = MODULES.reduce(
  (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.words?.length ?? 0), 0),
  0,
)

export const wordById = new Map<string, Word>(
  MODULES.flatMap((m) => m.lessons.flatMap((l) => l.words ?? [])).map((word) => [word.id, word]),
)

export const lessonById = new Map(ALL_LESSONS.map((e) => [e.lesson.id, e]))
