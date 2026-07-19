import type { Module, Word } from './types'

/* ------------------------------------------------------------------ */
/* A2 modules — el temps, la família, a la platja                      */
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
/* Module 6 — El temps  (météo, jours, heure)                          */
/* ------------------------------------------------------------------ */
const m6: Module = {
  id: 'temps',
  title: 'La météo & le temps',
  titleCa: 'El temps',
  color: 'mar',
  emblem: 'weather',
  description: 'La météo, les jours, l’heure',
  tidbits: [
    'Barcelone compte plus de 2 500 heures de soleil par an — « fa sol » sera ton bulletin météo préféré.',
    'L’heure catalane se dit par quarts : « dos quarts de tres » (deux quarts de trois) = 14 h 30. Un système unique au monde !',
    '« El temps » veut dire à la fois « le temps qu’il fait » et « le temps qui passe » — comme en français.',
  ],
  lessons: [
    {
      id: 'temps-1',
      title: 'Quel temps fait-il ?',
      titleCa: 'Quin temps fa?',
      kind: 'words',
      words: [
        w('quin-temps-fa', 'Quin temps fa?', 'Quel temps fait-il ?', 'kinn tèmps FA', '🌤️', {
          ex: { ca: 'Quin temps fa avui?', fr: 'Quel temps fait-il aujourd’hui ?' },
        }),
        w('fa-sol', 'Fa sol', 'Il fait soleil', 'fa SOL', '☀️', {
          note: 'Littéralement « il fait soleil » — la météo se dit avec « fa ».',
        }),
        w('fa-calor', 'Fa calor', 'Il fait chaud', 'fa keu-LO', '🥵', {
          ex: { ca: 'Quina calor!', fr: 'Quelle chaleur !' },
        }),
        w('fa-fred', 'Fa fred', 'Il fait froid', 'fa FRÈTT', '🥶'),
        w('fa-vent', 'Fa vent', 'Il y a du vent', 'fa BÈNN', '🌬️'),
        w('plou', 'Plou', 'Il pleut', 'PLO-ou', '🌧️', {
          ex: { ca: 'Avui plou molt.', fr: 'Aujourd’hui il pleut beaucoup.' },
        }),
        w('neva', 'Neva', 'Il neige', 'NÈ-veu', '❄️'),
        w('els-nuvols', 'Els núvols', 'Les nuages', 'eulz NOU-boulss', '☁️'),
      ],
    },
    {
      id: 'temps-2',
      title: 'Les jours',
      titleCa: 'Els dies',
      kind: 'words',
      words: [
        w('dilluns', 'Dilluns', 'Lundi', 'di-LIOUNSS', '🌙', {
          note: 'Le jour de la Lune — « dies Lunae » en latin.',
        }),
        w('dimarts', 'Dimarts', 'Mardi', 'di-MARTSS', '🔴'),
        w('dimecres', 'Dimecres', 'Mercredi', 'di-MÈ-creuss', '📌'),
        w('dijous', 'Dijous', 'Jeudi', 'di-JO-ouss', '🍲'),
        w('divendres', 'Divendres', 'Vendredi', 'di-BÈN-dreuss', '🎉'),
        w('dissabte', 'Dissabte', 'Samedi', 'di-SAP-teu', '🛍️'),
        w('diumenge', 'Diumenge', 'Dimanche', 'di-ou-MÈN-jeu', '🥘', {
          ex: { ca: 'Diumenge fem paella.', fr: 'Dimanche on fait une paella.' },
        }),
        w('avui', 'Avui', 'Aujourd’hui', 'eu-VOUÏ', '📍'),
        w('dema', 'Demà', 'Demain', 'deu-MA', '➡️', {
          ex: { ca: 'Demà fa sol!', fr: 'Demain il fait soleil !' },
        }),
        w('ahir', 'Ahir', 'Hier', 'eu-Ï', '⬅️'),
      ],
    },
    {
      id: 'temps-3',
      title: 'Quelle heure est-il ?',
      titleCa: 'Quina hora és?',
      kind: 'words',
      words: [
        w('quina-hora-es', 'Quina hora és?', 'Quelle heure est-il ?', 'KI-neu O-reu ÉSS', '🕰️'),
        w('la-una', 'La una', 'Une heure', 'la OU-neu', '🕐', {
          note: 'La seule heure au féminin singulier : « és la una ».',
        }),
        w('les-tres-en-punt', 'Les tres en punt', 'Trois heures pile', 'leuss TRÈSS eun POUNN', '🕒', {
          ex: { ca: 'A les tres en punt.', fr: 'À trois heures pile.' },
        }),
        w('el-mati', 'El matí', 'Le matin', 'eul meu-TI', '🌅', {
          ex: { ca: 'A les deu del matí.', fr: 'À dix heures du matin.' },
        }),
        w('la-tarda-mot', 'La tarda', 'L’après-midi', 'la TAR-deu', '🌇'),
        w('el-vespre', 'El vespre', 'Le soir', 'eul BÈSS-preu', '🌆'),
        w('el-migdia', 'El migdia', 'Midi', 'eul mitch-DI-eu', '🕛', {
          note: 'L’heure sacrée du vermut !',
        }),
        w('la-mitjanit', 'La mitjanit', 'Minuit', 'la mid-jeu-NITT', '🌌'),
      ],
    },
    {
      id: 'temps-dialogue',
      title: 'Des plans pour demain',
      titleCa: 'Plans per demà',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Núria',
        npcEmoji: '👩🏻‍🦱',
        scene: 'Núria t’écrit pour organiser la journée de demain.',
        turns: [
          { kind: 'npc', ca: 'Hola! Quin temps fa demà?', fr: 'Salut ! Quel temps fait-il demain ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Demà fa sol i calor!', fr: 'Demain il fait soleil et chaud !', ok: true },
              { ca: 'Demà és la mitjanit.', fr: 'Demain c’est minuit.', ok: false },
              { ca: 'Ahir, gràcies.', fr: 'Hier, merci.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Perfecte! Anem a la platja?', fr: 'Parfait ! On va à la plage ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí, genial! A quina hora?', fr: 'Oui, génial ! À quelle heure ?', ok: true },
              { ca: 'No, fa sol.', fr: 'Non, il fait soleil.', ok: false },
              { ca: 'El compte, si us plau.', fr: 'L’addition, s’il vous plaît.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'A les deu del matí?', fr: 'À dix heures du matin ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'D’acord, a les deu en punt!', fr: 'D’accord, à dix heures pile !', ok: true },
              { ca: 'D’acord, ahir a la una.', fr: 'D’accord, hier à une heure.', ok: false },
              { ca: 'Quant costa el matí?', fr: 'Combien coûte le matin ?', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Molt bé. I si plou?', fr: 'Très bien. Et s’il pleut ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Si plou, anem al museu.', fr: 'S’il pleut, on va au musée.', ok: true },
              { ca: 'Si plou, fa sol.', fr: 'S’il pleut, il fait soleil.', ok: false },
              { ca: 'Si plou, tinc gana.', fr: 'S’il pleut, j’ai faim.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Ha, ha! Fantàstic. Fins demà!', fr: 'Ha ha ! Fantastique. À demain !' },
          {
            kind: 'you',
            choices: [
              { ca: 'Fins demà, bona nit!', fr: 'À demain, bonne nuit !', ok: true },
              { ca: 'Fins ahir!', fr: 'À hier !', ok: false },
              { ca: 'Benvingut!', fr: 'Bienvenue !', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 7 — La família                                               */
/* ------------------------------------------------------------------ */
const m7: Module = {
  id: 'familia',
  title: 'La famille',
  titleCa: 'La família',
  color: 'terra',
  emblem: 'family',
  description: 'Les proches, décrire quelqu’un',
  tidbits: [
    'Attention au faux ami : « els parents » signifie « la parenté, les proches ». Les parents (papa-maman), ce sont « els pares ».',
    'Le Tió de Nadal : en décembre, les familles catalanes « nourrissent » une bûche souriante… qui offre des cadeaux quand on la tape en chantant !',
    '« Dona » veut dire à la fois « femme » et « épouse ». Et « home », « homme ». Simple et efficace.',
  ],
  lessons: [
    {
      id: 'familia-1',
      title: 'La famille proche',
      titleCa: 'La família',
      kind: 'words',
      words: [
        w('la-familia', 'La família', 'La famille', 'la feu-MI-li-eu', '👨‍👩‍👧‍👦', {
          ex: { ca: 'La meva família és gran.', fr: 'Ma famille est grande.' },
        }),
        w('el-pare', 'El pare', 'Le père', 'eul PA-reu', '👨🏻', {
          note: 'Papa se dit « papa », comme en français.',
        }),
        w('la-mare', 'La mare', 'La mère', 'la MA-reu', '👩🏻'),
        w('els-pares', 'Els pares', 'Les parents', 'eulss PA-reuss', '💑', {
          note: 'Faux ami : « els parents » = la parenté !',
        }),
        w('el-germa', 'El germà', 'Le frère', 'eul jeur-MA', '👦🏻', {
          ex: { ca: 'Tinc un germà.', fr: 'J’ai un frère.' },
        }),
        w('la-germana', 'La germana', 'La sœur', 'la jeur-MA-neu', '👧🏻'),
        w('el-fill', 'El fill', 'Le fils', 'eul FILIE', '👶🏻', {
          note: 'Le « ll » final se mouille : « filie ».',
        }),
        w('la-filla', 'La filla', 'La fille', 'la FI-lieu', '🧒🏻'),
      ],
    },
    {
      id: 'familia-2',
      title: 'Grands-parents & co',
      titleCa: 'Els avis',
      kind: 'words',
      words: [
        w('l-avi', "L'avi", 'Le grand-père', 'LA-vi', '👴🏻', {
          ex: { ca: 'L’avi fa pa amb tomàquet.', fr: 'Papi fait du pain à la tomate.' },
        }),
        w('l-avia', "L'àvia", 'La grand-mère', 'LA-vi-eu', '👵🏻'),
        w('el-tiet', 'El tiet', 'Le tonton', 'eul ti-ÈTT', '🧔🏻', {
          note: 'Familier et très catalan — « l’oncle » existe aussi.',
        }),
        w('la-tieta', 'La tieta', 'La tata', 'la ti-È-teu', '👩🏻‍🦳'),
        w('el-cosi', 'El cosí', 'Le cousin', 'eul cou-ZI', '🧑🏻', {
          note: 'La cousine : « la cosina ».',
        }),
        w('el-marit', 'El marit', 'Le mari', 'eul meu-RITT', '🤵🏻'),
        w('la-dona-mot', 'La dona', 'La femme / l’épouse', 'la DO-neu', '👰🏻', {
          note: 'Les deux sens à la fois, selon le contexte.',
        }),
        w('el-gos', 'El gos', 'Le chien', 'eul GOSS', '🐕', {
          ex: { ca: 'El gos també és família!', fr: 'Le chien aussi, c’est la famille !' },
        }),
      ],
    },
    {
      id: 'familia-3',
      title: 'Décrire quelqu’un',
      titleCa: 'Com és?',
      kind: 'words',
      words: [
        w('gran', 'Gran', 'Grand / âgé', 'GRANN', '🌳', {
          note: 'Pour la taille d’une personne, on dit plutôt « alt ».',
        }),
        w('petit', 'Petit', 'Petit', 'peu-TITT', '🌱', {
          ex: { ca: 'El meu germà petit.', fr: 'Mon petit frère.' },
        }),
        w('jove', 'Jove', 'Jeune', 'JO-veu', '🧃'),
        w('simpatic', 'Simpàtic', 'Sympa', 'sim-PA-tic', '😄', {
          note: '« Simpàtica » au féminin.',
        }),
        w('guapo', 'Guapo', 'Beau', 'GOUA-pou', '😎', {
          note: '« Guapa » au féminin — tu l’entendras partout !',
        }),
        w('alt', 'Alt', 'Grand (taille)', 'ALL(T)', '🦒'),
        w('baix', 'Baix', 'Petit (taille)', 'BACH', '🐿️'),
        w('content', 'Content', 'Content', 'coun-TÈNN', '🥳', {
          ex: { ca: 'Estic molt content!', fr: 'Je suis très content !' },
        }),
      ],
    },
    {
      id: 'familia-dialogue',
      title: 'Le café avec Rosa',
      titleCa: 'El cafè amb la Rosa',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Rosa',
        npcEmoji: '👵🏻',
        scene: 'Ta voisine Rosa t’invite à prendre le café et veut tout savoir.',
        turns: [
          { kind: 'npc', ca: 'Hola, maco! Tens germans?', fr: 'Salut mon joli ! Tu as des frères et sœurs ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí, tinc un germà i una germana.', fr: 'Oui, j’ai un frère et une sœur.', ok: true },
              { ca: 'Sí, tinc un gelat.', fr: 'Oui, j’ai une glace.', ok: false },
              { ca: 'No, gràcies, adéu!', fr: 'Non merci, au revoir !', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Que bé! I els teus pares, com són?', fr: 'Super ! Et tes parents, comment sont-ils ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Són joves i molt simpàtics.', fr: 'Ils sont jeunes et très sympas.', ok: true },
              { ca: 'Són dimarts.', fr: 'Ils sont mardi.', ok: false },
              { ca: 'Fa vent.', fr: 'Il y a du vent.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'I tens gos?', fr: 'Et tu as un chien ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí! És petit i molt content.', fr: 'Oui ! Il est petit et très content.', ok: true },
              { ca: 'Sí, és la meva germana.', fr: 'Oui, c’est ma sœur.', ok: false },
              { ca: 'El gos és un núvol.', fr: 'Le chien est un nuage.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Ha, ha! La família és el més important.', fr: 'Ha ha ! La famille, c’est le plus important.' },
          {
            kind: 'you',
            choices: [
              { ca: 'I tant! I tu, tens fills?', fr: 'Bien sûr ! Et vous, vous avez des enfants ?', ok: true },
              { ca: 'Massa car!', fr: 'Trop cher !', ok: false },
              { ca: 'Tot recte, si us plau.', fr: 'Tout droit, s’il vous plaît.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Dos fills i quatre nets! Vine, el cafè està llest.', fr: 'Deux enfants et quatre petits-enfants ! Viens, le café est prêt.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Gràcies, Rosa! Encantat.', fr: 'Merci, Rosa ! Enchanté.', ok: true },
              { ca: 'El lavabo està content.', fr: 'Les toilettes sont contentes.', ok: false },
              { ca: 'Fins ahir!', fr: 'À hier !', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Module 8 — A la platja                                              */
/* ------------------------------------------------------------------ */
const m8: Module = {
  id: 'platja',
  title: 'La plage & les sorties',
  titleCa: 'A la platja',
  color: 'sol',
  emblem: 'beach',
  description: 'La mer, la terrasse, le week-end',
  tidbits: [
    'L’orxata de xufa — lait de souchet glacé — est LA boisson d’été. Avec des fartons à tremper, c’est le bonheur.',
    '« Fer el vermut » : l’apéritif du dimanche midi, vermouth, olives et chips. Un rituel sacré à Barcelone.',
    'La Barceloneta était un quartier de pêcheurs. Ses plages actuelles ont été créées pour les Jeux de 1992 !',
  ],
  lessons: [
    {
      id: 'platja-1',
      title: 'La mer',
      titleCa: 'El mar',
      kind: 'words',
      words: [
        w('el-mar', 'El mar', 'La mer', 'eul MAR', '🌊', {
          ex: { ca: 'El mar està tranquil.', fr: 'La mer est calme.' },
        }),
        w('la-sorra', 'La sorra', 'Le sable', 'la SO-reu', '🏖️'),
        w('nedar', 'Nedar', 'Nager', 'neu-DA', '🏊', {
          ex: { ca: 'Anem a nedar?', fr: 'On va nager ?' },
        }),
        w('el-banyador', 'El banyador', 'Le maillot de bain', 'eul beu-nieu-DO', '🩳'),
        w('la-tovallola', 'La tovallola', 'La serviette', 'la tou-veu-LIO-leu', '🧻', {
          note: 'Quatre syllabes qui chantent : to-va-llo-la.',
        }),
        w('les-ulleres-de-sol', 'Les ulleres de sol', 'Les lunettes de soleil', 'leuz ou-LIÈ-reuss deu SOL', '🕶️'),
        w('la-crema-solar', 'La crema solar', 'La crème solaire', 'la CRÈ-meu sou-LAR', '🧴'),
        w('l-onada', "L'onada", 'La vague', 'lou-NA-deu', '🌊', {
          ex: { ca: 'Quines onades!', fr: 'Quelles vagues !' },
        }),
      ],
    },
    {
      id: 'platja-2',
      title: 'À la terrasse',
      titleCa: 'La terrassa',
      kind: 'words',
      words: [
        w('el-gelat', 'El gelat', 'La glace', 'eul jeu-LATT', '🍦', {
          ex: { ca: 'Un gelat de xocolata.', fr: 'Une glace au chocolat.' },
        }),
        w('l-orxata', "L'orxata", 'L’horchata', 'lour-CHA-teu', '🥛', {
          note: 'Boisson glacée au souchet — l’été en verre.',
        }),
        w('el-vermut', 'El vermut', 'Le vermouth', 'eul beur-MOUTT', '🍸', {
          note: '« Fer el vermut » = prendre l’apéro.',
        }),
        w('la-terrassa', 'La terrassa', 'La terrasse', 'la teu-RA-seu', '⛱️'),
        w('prendre-alguna-cosa', 'Prendre alguna cosa', 'Boire un verre', 'PÈN-dreu eul-GOU-neu CO-zeu', '🥂', {
          ex: { ca: 'Prenem alguna cosa?', fr: 'On prend un verre ?' },
        }),
        w('la-festa', 'La festa', 'La fête', 'la FÈSS-teu', '🎊'),
        w('la-musica', 'La música', 'La musique', 'la MOU-zi-keu', '🎶'),
        w('ballar', 'Ballar', 'Danser', 'beu-LIA', '💃', {
          ex: { ca: 'M’agrada ballar!', fr: 'J’aime danser !' },
        }),
      ],
    },
    {
      id: 'platja-3',
      title: 'Un jour parfait',
      titleCa: 'Un dia perfecte',
      kind: 'words',
      words: [
        w('el-cap-de-setmana', 'El cap de setmana', 'Le week-end', 'eul CAP deu seut-MA-neu', '📅', {
          note: 'Littéralement « le bout de semaine ».',
        }),
        w('les-vacances', 'Les vacances', 'Les vacances', 'leuss veu-CAN-seuss', '🧳'),
        w('descansar', 'Descansar', 'Se reposer', 'deuss-can-SA', '😌'),
        w('passejar', 'Passejar', 'Se promener', 'peu-seu-JA', '🚶', {
          ex: { ca: 'Passejar pel Born.', fr: 'Se promener dans le Born.' },
        }),
        w('la-posta-de-sol', 'La posta de sol', 'Le coucher de soleil', 'la POSS-teu deu SOL', '🌅', {
          ex: { ca: 'Quina posta de sol!', fr: 'Quel coucher de soleil !' },
        }),
        w('fer-fotos', 'Fer fotos', 'Prendre des photos', 'fè FO-touss', '📸'),
        w('l-estiu', "L'estiu", 'L’été', 'leuss-TI-ou', '☀️', {
          note: 'L’hiver : « l’hivern ». Mais qui en veut ?',
        }),
        w('genial', 'Genial', 'Génial', 'jeu-ni-AL', '🤩', {
          ex: { ca: 'Barcelona és genial!', fr: 'Barcelone, c’est génial !' },
        }),
      ],
    },
    {
      id: 'platja-dialogue',
      title: 'Après-midi à la plage',
      titleCa: 'Tarda de platja',
      kind: 'dialogue',
      dialogue: {
        npcName: 'Laia',
        npcEmoji: '👩🏻‍🦰',
        scene: 'Au chiringuito de la Barceloneta, avec ton amie Laia.',
        turns: [
          { kind: 'npc', ca: 'Quina calor! Anem a nedar?', fr: 'Quelle chaleur ! On va nager ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí, vinga! El mar és genial.', fr: 'Oui, allez ! La mer est géniale.', ok: true },
              { ca: 'No, fa fred i neva.', fr: 'Non, il fait froid et il neige.', ok: false },
              { ca: 'On és l’estació?', fr: 'Où est la gare ?', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Després, prenem alguna cosa a la terrassa?', fr: 'Après, on prend un verre en terrasse ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Genial! Voldria una orxata.', fr: 'Génial ! Je voudrais une horchata.', ok: true },
              { ca: 'Genial! Voldria una tovallola.', fr: 'Génial ! Je voudrais une serviette.', ok: false },
              { ca: 'El semàfor, si us plau.', fr: 'Le feu rouge, s’il vous plaît.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Jo, un vermut! I un gelat per compartir?', fr: 'Moi, un vermouth ! Et une glace à partager ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí! El gelat aquí és boníssim.', fr: 'Oui ! La glace ici est délicieuse.', ok: true },
              { ca: 'No, el gelat és massa jove.', fr: 'Non, la glace est trop jeune.', ok: false },
              { ca: 'La sortida és a la dreta.', fr: 'La sortie est à droite.', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Mira… quina posta de sol més bonica.', fr: 'Regarde… quel beau coucher de soleil.' },
          {
            kind: 'you',
            choices: [
              { ca: 'Sí… Barcelona és genial.', fr: 'Oui… Barcelone, c’est génial.', ok: true },
              { ca: 'Sí, el banyador està tancat.', fr: 'Oui, le maillot est fermé.', ok: false },
              { ca: 'Quant val el sol?', fr: 'Combien vaut le soleil ?', ok: false },
            ],
          },
          { kind: 'npc', ca: 'Tornem el cap de setmana?', fr: 'On revient le week-end ?' },
          {
            kind: 'you',
            choices: [
              { ca: 'I tant! Fins dissabte!', fr: 'Bien sûr ! À samedi !', ok: true },
              { ca: 'No, fins ahir.', fr: 'Non, à hier.', ok: false },
              { ca: 'Bon profit, semàfor!', fr: 'Bon appétit, feu rouge !', ok: false },
            ],
          },
        ],
      },
    },
  ],
}

export const A2_MODULES: Module[] = [m6, m7, m8]
