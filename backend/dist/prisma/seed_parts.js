"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedParts = seedParts;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const rawCsv = `id_piece,piece,reference,categorie piece,lieu de maintenance,Qté. minimale,Qté. Dispo.,Qté. Req.,Qté.Com.,Description,Note,Fournisseur
1,1500/3133,N.R.,Roulement,,30,20,0,0,Ball Bearings for Conveyor Rollers
2,ABF-3/10,N.R.,Consommable,Bureau,,0,0,0,Filtre a air
3,Arbre Terzago HB,C062112,Autres,,0,1,0,0,Arbre sur lequel sont fixé les engrenage pour le mouvement haut bas,,MARC PRÉVOST MACHINERIE INC.
4,AutomationDirect compact limit switch,N.R.,Capteur,Bureau,2,2,0,0,AutomationDirect compact limit switch| 360 degree stainless steel spring| (1) N.O./(1) N.C. contact(s)| snap action| 35mm wide body| die-cast zinc| 5-pin M12 quick-disconnect| bottom exit.,AutomationDirect compact limit switch| 360 degree
5,Axe X Polisseur (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
6,Axe x Predator (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
7,Axe X Terzago (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
8,Axe X Wilson 3 (GD),Assemblage,Assemblage,,,0,1,0,Assemblage des composants de l'axe gauche droite
9,Axe X Wilson 3.5 (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
10,Axe Y Falcon (AA),Assemblage,Assemblage,,,0,0,0,Axe avant arrière de la Falcon
11,Axe Y Polisseur (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
12,Axe Y Predator (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
13,Axe Y Terzago (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
14,Axe Y Wilson 3 (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
15,Axe Y Wilson 3.5 (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
16,Axe Z Falcon (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
17,Axe Z Polisseur (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
18,Axe Z Predator (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
19,Axe Z Terzago (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
20,Axe Z Wilson 3 (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
21,Axe Z Wilson 3.5 (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
22,Batterie comp JD,PF31P7,Autres,,0,0,0,0,Batterie qui va sur le compresseur John Deer,,machineries Lourdes St-Raymond Inc
23,Bearing linear pour Noat,97 MO2 KWVE30BL G3V1,Roulement,,,0,0,0,Roulement linéaire pour la Noat
24,Bushing Prédator,FLN24,Roulement,,4,0,0,0,Bushing qui permet à la tête de la prédator de ce déplacer,,APPLIED INSDUSTRIAL TECHNOLOGIES
25,Cage de roulement driving shaft Falcon,FC214,Roulement,,,0,0,0,Cage dans laquelle est insérer le roulement du driving shaft de la Falcon,,APPLIED INSDUSTRIAL TECHNOLOGIES
26,Cam follower Falcon AA,CFE 30-2 BUUR,Roulement,,1,0,0,0,Cam follower installer sur la Falcon qui enligne les rails du mouvement avant arrière,IKO CFE 30-2 BUUR
27,Cam follower Polisseur,CF 2 1/2 SB,Roulement,,2,0,0,0,Cam follower qui vont sur la tête du polisseur,,APPLIED INSDUSTRIAL TECHNOLOGIES
28,Cam follower Wilson 3,CYR 2 3/4 S,Roulement,,0,0,0,0,Came situé sur la Wilson 3 mètre qui aligne le déplacement de gauche à droite,Mc GILL : CYR 2 3/4 S,APPLIED INSDUSTRIAL TECHNOLOGIES
29,Capteur Wilson 3.5 GD,E2E-X10MF1-M1,Capteur,,1,0,0,0,Capteur de proximité servant de limit switch sur la Wilson 3.5 mètre axe de gauche à droite,Omron E2E-X10MF1-M1,CALIBRATECK INC.
30,Chauffe Moteur 1500 W 120 V,TEM8600287,Autres,Container,1,0,0,0,,,Macpek inc.
31,Contacteur Pont roulant 25T GD,3RA2324-8XB30-1AK6,Contacteur,,1,0,0,0,Contacteur réversible du pont roulant 25T de gauche à droite,Gauche à droite si on regarde l'usine par les por
32,Contacteur Pont roulant usine 4 HB,3RA2328-8XB30-1AK6,Contacteur,,0,0,0,0,Contcteur du pont roulant situé à l'usine 4 qui permet de monter et descendre,,MLE SERVICES
33,Coupe Courant,POL51902,Autres,,0,0,0,0,Coupe courant aussi appelé couteaux électrique,,Macpek inc.
34,Courroie moteur prédator,8140253,Courroie,,0,0,0,0,Courroie reliant la poulie du moteur à la poulie du shaft de la prédator,,PARK INDUSTRIES
35,,,,,,,,,,,APPLIED INSDUSTRIAL TECHNOLOGIES
36,Courroie scie Prédator,8140265,Courroie,,0,0,0,0,Courroie reliant la poulie de l'arbre central à l'arbre de la scie sur la prédator.,,PARK INDUSTRIES
37,,,,,,,,,,,APPLIED INSDUSTRIAL TECHNOLOGIES
38,Engrenage terzago AA,C1302106,Engrenage,,0,0,0,0,Engrenage de l'axe y avant arrière installé sur la Terzago,,MARC PRÉVOST MACHINERIE INC.
39,Engrenage Terzago HB,C074140/01,Engrenage,,2,1,0,0,Gros engrenage de l'axe Z de la Terzago,Numéro MPM: C074140/01,MARC PRÉVOST MACHINERIE INC.
40,Engrenage Terzago HB,C074141/01,Engrenage,,2,1,0,0,Petit engrenage de l'axe Z sur la Terzago,Numéro MPM: C074141/01,MARC PRÉVOST MACHINERIE INC.
41,Engrenage Wilson 3 AA,S-624,Engrenage,,1,0,0,0,Engrenage qui active le déplacement de l'axe avant arrière de la Wilson 3,,APPLIED INSDUSTRIAL TECHNOLOGIES
42,Engrenage Wilson 3 GD,S320,Engrenage,,1,0,0,0,Engrenage de l'axe X de gauche à droite sur la Wilson 3,S320
43,Engrenage Wilson 3.5 AA,S520 14-1/2,Engrenage,,1,0,0,0,Engrenage de la Wilson 3.5 de l'axe avant arrière,Martin S520 14-1/2
44,Engrenage Wilson 3.5 GD,S514 14.5,Engrenage,,1,,0,0,Engrenage de l'axe X de gauche à droite sur la Wilson 3.5,,HARVEY ROULEMENTS. BEARINGS
45,essai,a détruire,Roulement,a détruire,,0,0,0
46,Fan de chauffrette Dresseur,TEM710025,Autres,,0,0,0,0,Fan de la chauffrette du dresseur,,Macpek inc.
47,Filtre a gasoil,3682,Filtre,Bureau,,2,0,0
48,Filtre a huile,B161-S,Filtre,Bureau,,2,0,0
49,Filtre a huile,BT310,Filtre,,,2,0,0
50,Filtre a huile hydraulique,WIX 51782,Filtre,Bureau,,1,0,0,POUR TEREX
51,Filtre a huile hydraulique,N.R.,Filtre,Bureau,,1,0,0,POUR TEREX
52,Filtre air compresseur JD,1310033926,Filtre,,0,0,0,0,Filtre à air du compresseur John Deer
53,Filtre air gros Dresseur,42637,Filtre,,0,0,0,0,,Wix: 42637,AGI St-Raymond
54,,,,,,,,,,Fleetguard: AF919
55,Filtre air petit Dresseur,42638,Filtre,,0,0,0,0,,Wix: 42638,AGI St-Raymond
56,,,,,,,,,,Fleetguard: AF929
57,Filtre air Volvo,4881174,Filtre,,0,0,0,0,Filtre à air du Volvo,Volvo: 4881174,machineries Lourdes St-Raymond Inc
58,,,,,,,,,,Fleetgard: AF851M
59,Filtre air Volvo,11007848,Filtre,,0,0,0,0,Filtre à air du Volvo,Volvo: 11007848,machineries Lourdes St-Raymond Inc
60,,,,,,,,,,Fleetguard: AF25953
61,Filtre air Volvo 2,4881175,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 4881175,machineries Lourdes St-Raymond Inc
62,,,,,,,,,,Fleetguard: AF883M
63,Filtre air Volvo 3,6639203,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 6639203,machineries Lourdes St-Raymond Inc
64,,,,,,,,,,Fleetguard: AF4106
65,Filtre à air Volvo,11007847,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 11007847,machineries Lourdes St-Raymond Inc
66,,,,,,,,,,Fleetguard: AF25954
67,Filtre Cat 988,42680,Filtre,,0,0,0,0,Filtre à air,No filtre: 42680
68,Filtre Cat 988,51792,Filtre,,0,0,0,0,Filtre à l'huile,No filtre: 51792
69,Filtre Cat 988,33384,Filtre,,0,0,0,0,Filtre à gaz,No filtre: 33384
70,Filtre Cat 988,33405,Filtre,,0,0,0,0,Filtre à gaz,No filtre: 33405
71,Filtre eau Dresseur,24071,Filtre,,0,0,0,0,,Wix: 24071
72,,,,,,,,,,Fleetguard: WF2051
73,Filtre eau Volvo,1699830,Filtre,,0,0,0,0,Filtre à l'eau du moteur Volvo,Volvo: 1699830,machineries Lourdes St-Raymond Inc
74,,,,,,,,,,Fleetguard: WF2096
75,Filtre fuel Dresseur,33116,Filtre,,0,0,0,0,,Wix: 33116
76,,,,,,,,,,Fleetguard: FF202
77,Filtre fuel Volvo,466987,Filtre,,0,0,0,0,Filtre à fuel du moteur du Volvo,Volvo: 466987,machineries Lourdes St-Raymond Inc
78,,,,,,,,,,Fleetguard: FF42000
79,Filtre gaz comp JD,533752,Filtre,,0,,,,Filtre à gaz
80,Filtre huile comp JD,57076,Filtre,,0,,,,Filtre à l'huile du moteur du compresseur
81,Filtre huile hydraulique Volvo,11026936,Filtre,,0,0,0,0,Filtre à l'huile hydraulique du Volvo,Volvo: 11026936,machineries Lourdes St-Raymond Inc
82,,,,,,,,,,Fleetguard: HF28805
83,Filtre huile hydraulique Volvo,965899,Filtre,,0,0,0,0,Filtre pour l'huile hydraulique du Volvo,Volvo: 965899,machineries Lourdes St-Raymond Inc
84,,,,,,,,,,Fleetguard: HF6586
85,Filtre huile hydraulique Volvo 2,12973159,Filtre,,0,0,0,0,Filtre pour l'huile hydraulique du Volvo,Volvo: 12973159,machineries Lourdes St-Raymond Inc
86,,,,,,,,,,Fleetguard: HF6451
87,Filtre huile moteur Dresseur,51749,Filtre,,,0,0,0,,Wix:51749,AGI St-Raymond
88,,,,,,,,,,Fleetguard: LF777
89,Filtre huile moteur Volvo,466634,Filtre,,0,0,0,0,Filtreur pour l'huile du moteur du Volvo,Volvo: 466634,machineries Lourdes St-Raymond Inc
90,,,,,,,,,,Fleetguard: LF3321
91,Filtre huile moteur Volvo 2,477556,Filtre,,0,0,0,0,Filtreur à l'huile du moteur du volvo,Volvo: 477556,machineries Lourdes St-Raymond Inc
92,,,,,,,,,,Fleetguard: LF3654
93,Filtre stainer huile moteur Dresseur,51954,Filtre,,,0,0,0,,Wix: 51954
94,,,,,,,,,,Fleetguard: LF516
95,Filtre volvo ?,11006995,Filtre,,,0,0,0,Je sais pas c'est quoi,,machineries Lourdes St-Raymond Inc
96,Flow switch Wilson,We Anderson V8,Capteur,,1,0,0,0,interrupteur de débit qui est installer sur les scie Wilson 3 et 3.5 mètre,WE Anderson V8,ITM INSTRUMENTS
97,Frein moteur Wilson 3 (AA),105672105PF,Moteur,,,0,0,0,Frein du moteur de la Wilson 3 mètre situé sur l'axe avant arrière,Stearns 59BK2105-PF
98,,,,,,,,,,Model number: 105672105PF
99,,,,,,,,,,Ser
100,Frein moteur Wilson 3.5 (AA),C2006-551-R1DD,Moteur,,,0,0,0,Frein du moteur de l'axe avant arrière situé sur la Wilson 3.5 mètre,Dings dynamic group
101,,,,,,,,,,Model: C2006-551-R1DD
102,,,,,,,,,,Serial
103,Joint caoutchouc,D123007,Joint,Garage,2,0,2,2,joint pour la table tournante
104,L095 1,N.R.,Assemblage,Bureau,,0,0,0,Jaw Coupling Hub,,GENERAL BEARING SERVICE INC.
105,L095 7/8,N.R.,Assemblage,Bureau,,0,0,0,,Jaw Coupling Hub,GENERAL BEARING SERVICE INC.
106,Limit switch Polisseur AA,D4A-1101N,Capteur,,1,0,0,0,Capteur de fin de course de l'axe avant arrière,OMRON D4A-1101N,CALIBRATECK INC.
107,Limit switch Terzago,D4A-1116N,Capteur,,1,0,2,2,Capteur de fin de course servant à éviter les collisions entre la roche et la partie fixer au centre de la scie,Omron D4A-1116N,CALIBRATECK INC.
108,Limit switch Terzago HB,D4N-2120,Capteur,,1,0,0,0,Capteur de fin de course de l'axe des z haut bas,Omron D4N-2120,CALIBRATECK INC.
109,Maille chaine Explorer,81C1007,Autres,,2,0,0,0,Maille de chaine qui permet au roue d'avancer sur l'Explorer,,NOVAMAC INDUSTRIES INC
110,Moteur 2hp Polisseur (GD),SRF4S2TCN61,Moteur,,,0,0,0,Moteur 2 HP utilisé sur l'axe gauche droite du polisseur,Lincoln motors
111,,,,,,,,,,Model: SRF4S2TCN61
112,,,,,,,,,,Product: 6VK LM
113,Moteur 1/2HP (AA),F56C 1/2M4A,Moteur,,,0,0,0,Moteur de 1/2HP utilisé sur plusieurs machines pour l'axe avant arrière,Newport
114,,,,,,,,,,Model: F56C 1/2M4A
115,,,,,,,,,,Frame: 56C
116,,,,,,,,,,HP: 1/2
117,,,,,,,,,,Nem
118,Moteur 2 HP (HB),56C2M4D,Moteur,,,0,0,0,Moteur de 2 hp utilisé pour les déplacement vertical haut et bas,Newport electronic motor
119,,,,,,,,,,Model: 56C2M4D
120,,,,,,,,,,Frame: 56
121,Moteur 2HP (GD),YSN5664G,Moteur,,,0,0,0,Moteur de 2 hp utilisé sur plusieurs machines pour le déplacement gauche droite,JRP Nema Frame 56C
122,,,,,,,,,,Model no: YSN5664G
123,,,,,,,,,,Frame: 56C
124,Moteur chauffrette Dresseur,TEM7100006,Moteur,,0,0,0,0,Moteur de chauffrette qui va sur le dresseur,,Macpek inc.
125,Moteur hydraulique Explorer,PLM30 43S0-3255-LOF/0C N,Moteur,,0,0,0,0,Moteur hydraulique du compresseur sur l'exploreur
126,Moteur Terzago axe Z,SH-90S-4,Moteur,,0,0,0,0,Moteur de la Terzago qui active l'axe Z,Cantoni group
127,,,,,,,,,,Type:SH-90S
128,,,,,,,,,,RPM: 1685 Fournisseur e
129,Moteur Volvo 330,TD164KAE,Moteur,,,0,0,0,Information sur le moteur du Volvo 330,Engine family: WVSXL16.OCE1
130,,,,,,,,,,Engine model: TD164KA
131,Moteur Wilson 3.5 (GD),1UUU7L0,Moteur,,0,0,0,0,Moteur servant au déplacement gauche droite sur la Wilson 3.5 mètre,JRP
132,,,,,,,,,,Frame: 56H
133,,,,,,,,,,SÉRIE: 1UUU7L0
134,,,,,,,,,,HP: 2
135,,,,,,,,,,RPM: 1724
136,NP-28,N.R.,Roulement,Bureau,2,2,0,0,Ball Bearing Unit,Sealmaster NP-28
137,,,,,,,,,,700193 Ball Bearing Unit - Two-B
138,Nut en bronze - RH20125,N.R.,N.D.,Bureau,4,5,0,0,Nut en bronze pour vis sans fin up and down scie bleue,,GENERAL BEARING SERVICE INC.
139,polisseur ressort tête à martelage,300misc,Autres,,0,0,0,0,Ressort installé sur la tête à marteler du polisseur,300misc spring for polishing plate,DERUSHA SUPPLY INC.
140,Polisseur tête à martelage,23014542,Autres,,1,0,0,0,Pièce qui se monte sur le polisseur qui donne un fini martelé à la pierre,,DERUSHA SUPPLY INC.
141,Pompe eau propre,20WA15S4-PE,Autres,,0,0,0,0,Pompe pour l'eau propre à l'usine 2,Franklin electric (Water horse)
142,,,,,,,,,,Model: 20WA15S4-P
143,Poulie arbre Prédator moteur,8130249,Poulie,,0,0,0,0,Jack shaft sheave,Poulie installer sur le shaft qui est relié par l,PARK INDUSTRIES
144,Poulie arbre Prédator scie,8130357,Poulie,,0,0,0,0,Poulie installé sur l'arbre central relier par la courroie à l'arbre de la scie,,PARK INDUSTRIES
145,Poulie moteur Prédator,8130273,Poulie,,0,0,0,0,Motor sheave,,PARK INDUSTRIES
146,Poulie scie Prédator,8130361,Poulie,,0,0,0,0,Poulie installer sur l'abre de la scie de la prédtor,Abor sheave,PARK INDUSTRIES
147,Pressure switch Dresseur,A-273541M1,Capteur,,0,0,0,0,Pressure switch qui active le son lorsque l'on recule avec le dresseur,,machineries Lourdes St-Raymond Inc
148,Protection Predator,8281020,Protection,,0,0,0,0,Accordéon de protection en dessous du pont (Bottom Bridge Bellow),,PARK INDUSTRIES
149,Protection Predator,8281021,Protection,,0,,0,0,Accordéon de protection sur le dessus le du pont (Top Bridge bellow),,PARK INDUSTRIES
150,Protection Predator,8281021,Protection,,0,0,0,0,Accordeon de protection du pont (Top way cover),,PARK INDUSTRIES
151,Réducteur Polisseur AA,GR8240558.23,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur le polisseur,Ironman by Grove Gear
152,,,,,,,,,,Catalog #: GR8240558.23
153,,,,,,,,,,Mod
154,Réducteur Polisseur GD,HM224-1,Réducteur,,,0,0,0,,Grove gear
155,,,,,,,,,,Model No: HM2241-1
156,,,,,,,,,,Serial no: 30033051
157,Réducteur Terzago HB,A102 UH25 F1A 23.8 S1 VA PAM80,Réducteur,,0,1,0,0,Réducteur de vitesse du moteur de l'axe haut bas situé sur la Terzago,,MARC PRÉVOST MACHINERIE INC.
158,Réducteur Wilson 3 AA,?,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur la Wilson 3 mètre,Pas de marque seulement des numéro
159,,,,,,,,,,33N-560
160,,,,,,,,,,991740
161,Réducteur Wilson 3 GD,M3213BAH60A,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe gauche droite situé sur la Wilson 3 mètre,Cleveland Gear
162,,,,,,,,,,Model no: M3213BAH60A
163,,,,,,,,,,Type: 1CHS
164,,,,,,,,,,S
165,Réducteur Wilson 3 HB,232BQ025562,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe haut bas situé sur la Wilson 3 mètre,Sterling electric| inc
166,,,,,,,,,,Frame no: 232BQ025562
167,,,,,,,,,,Seri
168,Réducteur Wilson 3.5 AA,?,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur la Wilson 3.5 mètre,Pas de marque seulement des chiffres sur une plaq
169,RH12125 Vis sans fin,N.R.,Assemblage,,,0,0,0,,,GENERAL BEARING SERVICE INC.
170,Roue des scie Wilson,A déterminer,Roue,,1,0,1,0,Roue utilisé sur les rails de la Wlson 3 et 3.5 mètres
171,Roue Falcon,BigWheel1000mm,Roue,Usine3,1,0,,,Roue de 1000 mm de diametre,Aucun reference du fournisseur HUADA,HuaDa Superabrasive Tool
172,Roulement convoyeur entrer splitter,UCFB 28-24,Roulement,,1,0,0,0,Roulement qui vont à l'avant du convoyeur à l'entré de la guillotine,Casting: FB208,APPLIED INSDUSTRIAL TECHNOLOGIES
173,,,,,,,,,,Bearing: UC208-24
174,Roulement convoyeur sortie splitteur,FRANTZ-2532,Roulement,,6,0,0,0,Roulement du convoyeur à rouleaux à la sortie du splitter,,APPLIED INSDUSTRIAL TECHNOLOGIES
175,Roulement des roues Falcon AA,UCP212D1,Roulement,,0,0,0,0,Roulement pour les roues déplacement avant arrière de la Falcon,NTN UCP212D1,APPLIED INSDUSTRIAL TECHNOLOGIES
176,Roulement driving shaft Falcon,UC214D1,Roulement,,0,0,0,0,Roulement fixé à l'arbre qui transmet la puissance sur la Falcon,,APPLIED INSDUSTRIAL TECHNOLOGIES
177,Roulement driving shaft Terzago,30215M-90KM1,Roulement,,0,0,0,0,Roulement fixer à l'arbre de la scie du côté de la scie sur la Terzago,Timken 30215M-90KM1
178,Roulement driving shaft Terzago,NU2312-E-TVP2-C3,Roulement,,1,0,0,0,Roulement fixer à l'arbre de la scie du côté de la poulie sur la Terzago,,APPLIED INSDUSTRIAL TECHNOLOGIES
179,Roulement Falcon HB,R151341013,Roulement,,1,0,,,Roulement linéaire en haut de l'axe haut bas,Rexroth R151341013
180,Roulement linéaire Terzago HB,R151344013,Roulement,,2,0,2,0,Roulement linéaire qui va sur la Terzago
181,Roulement plat Terzago HB,D14328,Roulement,,1,0,0,0,Roulement à plat qui va sur l'arbre de l'axe Z de la Terzago,Numéro mpm: D104328,APPLIED INSDUSTRIAL TECHNOLOGIES
182,,,,,,,,,,Numéro skf: 51205
183,,,,,,,,,,Préféré skf
184,Roulement Prédator,8070171-1,Roulement,Garage,9,0,0,0,Bearing de y et z sur la predator,,PARK INDUSTRIES
185,Roulement support d'arbre Terzago HB,D105010,Roulement,,2,0,0,0,Roulement de support de l'arbre qui va sur l'axe Z de la Terzago,Numéro MPM: D105010,APPLIED INSDUSTRIAL TECHNOLOGIES
186,,,,,,,,,,Numéro NTN: ASS205N
187,,,,,,,,,,Préféré s
188,Roulement support vis terzago HB,D104173,Roulement,,2,0,0,0,Roulement qui supporte les vis sans fin de l'axe Z sur la Terzago,Numéro MPM: D104173,APPLIED INSDUSTRIAL TECHNOLOGIES
189,,,,,,,,,,Numéro NSK: 3206B2RSTNGC3
190,,,,,,,,,,Pré
191,Roulement Wilson roue,3920,Roulement,,2,0,4,8,Bearing situé à l'intérieur des roues de la Wilson 3 et 3.5 mètre,Roulement situé à l'intérieur des roues de la Wil,HARVEY ROULEMENTS. BEARINGS
192,S614BS 1,N.R.,Engrenage,Bureau,,0,,0,,,GENERAL BEARING SERVICE INC.
193,Seal de roue Wilson,415088,Roulement,,2,0,4,8,Seal de roue pour la Wlson 3 et 3.5 mètre,Seal de roue pour la Wilson 3 et 3.5 mètre il y e,HARVEY ROULEMENTS. BEARINGS
194,Seal shaft scie Terzago,90-110-12,Roulement,,2,0,0,0,Seal qui sont poser avec les roulement sur le shaft de la scie de la Terzago,,APPLIED INSDUSTRIAL TECHNOLOGIES
195,Séparateur carburant/eau,N.R.,N.D.,Bureau,,3,0,0,3732
196,SKF 6208-2RS1,N.R.,N.D.,Bureau,4,3,0,0,Flange-Mount Ball Bearing Unit - 4-Bolt
197,Socle Wilson roue,3994,Roulement,,2,0,4,8,Socle du roulement pour les roue Wilson 3 et 3.5,Socle dans lequel s'appuie les bearings situé dan,HARVEY ROULEMENTS. BEARINGS
198,Solénoide Dresseur,66-123,Contacteur,,0,0,0,0,Solénoide du strater du Dresseur,SOLENOID 37MT 24V,machineries Lourdes St-Raymond Inc
199,SPIDER L090/L095,N.R.,Assemblage,Bureau,,0,0,0,Jaw Coupling Insert,,GENERAL BEARING SERVICE INC.
200,Spring Washer,D128076,Joint,Garage,2,0,2,2,Spring washer pour table terzago,,MARC PRÉVOST MACHINERIE INC.
201,Tige fillettée 5/8 GRADE 8,N.R.,N.D.,Usine 4,,6,0,0,,,DIST. J.M. BERGERON
202,UCFU-3/4M,N.R.,Roulement,Bureau,2,3,0,0,Roulements vis sans fin axe Z,Marque en stock : NTN,GENERAL BEARING SERVICE INC.
203,,,,,,,,,,Fournisseur habituel : Géné
204,X30210 Tapered Roller Bearings,N.R.,Roulement,Bureau,,2,0,0,This is the most basic and most widely used type of tapered roller bearing. It consists of two main separable parts: the cone (inner ring) assembly and the cup (outer ring). It is typically mounted in opposing pairs on a shaft.`;
function seedParts() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        console.log('Seeding parts...');
        const rows = rawCsv.split('\n');
        let currentPart = null;
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row)
                continue;
            const cols = row.split(',');
            const name = (_a = cols[1]) === null || _a === void 0 ? void 0 : _a.trim();
            if (name) {
                const idStr = cols[0];
                const reference = (_b = cols[2]) === null || _b === void 0 ? void 0 : _b.trim();
                const categoryName = (_c = cols[3]) === null || _c === void 0 ? void 0 : _c.trim();
                const siteName = (_d = cols[4]) === null || _d === void 0 ? void 0 : _d.trim();
                const minQty = parseFloat(cols[5]) || 0;
                const stockQty = parseFloat(cols[6]) || 0;
                const reqQty = parseFloat(cols[7]) || 0;
                const orderedQty = parseFloat(cols[8]) || 0;
                const description = (_e = cols[9]) === null || _e === void 0 ? void 0 : _e.trim();
                const note = (_f = cols[10]) === null || _f === void 0 ? void 0 : _f.trim();
                const supplier = (_g = cols[11]) === null || _g === void 0 ? void 0 : _g.trim();
                let categoryId = null;
                if (categoryName) {
                    const cat = yield prisma.partCategory.upsert({
                        where: { name: categoryName },
                        update: {},
                        create: { name: categoryName }
                    });
                    categoryId = cat.id;
                }
                let siteId = null;
                if (siteName) {
                    const site = yield prisma.maintenanceSite.upsert({
                        where: { name: siteName },
                        update: {},
                        create: { name: siteName }
                    });
                    siteId = site.id;
                }
                const existing = yield prisma.part.findFirst({
                    where: {
                        name: name,
                        reference: reference
                    }
                });
                if (existing) {
                    currentPart = existing;
                    yield prisma.part.update({
                        where: { id: existing.id },
                        data: {
                            stockQuantity: stockQty,
                            description: description
                        }
                    });
                }
                else {
                    currentPart = yield prisma.part.create({
                        data: {
                            name,
                            reference,
                            description,
                            note,
                            supplier,
                            minQuantity: minQty,
                            stockQuantity: stockQty,
                            reqQuantity: reqQty,
                            orderedQuantity: orderedQty,
                            categoryId,
                            siteId
                        }
                    });
                }
            }
            else {
                if (currentPart) {
                    let updateData = {};
                    if ((_h = cols[9]) === null || _h === void 0 ? void 0 : _h.trim())
                        updateData.description = (currentPart.description ? currentPart.description + '\n' : '') + cols[9].trim();
                    if ((_j = cols[10]) === null || _j === void 0 ? void 0 : _j.trim())
                        updateData.note = (currentPart.note ? currentPart.note + '\n' : '') + cols[10].trim();
                    if ((_k = cols[11]) === null || _k === void 0 ? void 0 : _k.trim())
                        updateData.supplier = (currentPart.supplier ? currentPart.supplier + '\n' : '') + cols[11].trim();
                    if (Object.keys(updateData).length > 0) {
                        currentPart = yield prisma.part.update({
                            where: { id: currentPart.id },
                            data: updateData
                        });
                    }
                }
            }
        }
        console.log('Finished seeding parts.');
    });
}
