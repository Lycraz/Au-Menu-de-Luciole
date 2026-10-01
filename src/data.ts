// Données de l'app : ingrédients et recettes (quantités pour 2 personnes).

export type MealKey = 'midi' | 'soir';
export type CatKey = 'fl' | 'viande' | 'frais' | 'boul' | 'epi' | 'surg';
/** [nom, rayon, jours de conservation, unité, flag] — flag 'm' = viande/poisson, 'j' = à acheter le jour même, 's' = placard (pas dans la liste) */
export type Ingredient = [string, CatKey, number, string, ('m' | 'j' | 's')?];
export type Recipe = { id: string; n: string; e: string; t: number; i: [string, number][]; s: string[]; custom?: boolean; src?: string };

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
export const MEALS: Record<MealKey, string> = { midi: 'Midi', soir: 'Soir' };
export const MEAL_KEYS: MealKey[] = ['midi', 'soir'];
export const CATS: [CatKey, string][] = [['fl', '🥕 Fruits et légumes'], ['viande', '🥩 Viande et poisson'], ['frais', '🧀 Crèmerie et frais'], ['boul', '🥖 Boulangerie'], ['epi', '🥫 Épicerie'], ['surg', '❄️ Surgelés']];
export const FISH = ['saumon', 'cabillaud', 'thon'];

export const ING: Record<string, Ingredient> = {
 pates:['Pâtes','epi',365,'g'],riz:['Riz','epi',365,'g'],semoule:['Semoule','epi',365,'g'],lentilles:['Lentilles corail','epi',365,'g'],
 coulis:['Coulis de tomate','epi',365,'g'],thon:['Thon en boîte','epi',365,'boîte','m'],poischiches:['Pois chiches','epi',365,'boîte'],
 haricots:['Haricots rouges','epi',365,'boîte'],coco:['Lait de coco','epi',365,'boîte'],tortillas:['Tortillas','epi',20,'pc'],
 painmie:['Pain de mie','boul',7,'tranche'],pain:['Baguette','boul',1,'pc','j'],painsburger:['Pains burger','boul',5,'pc'],
 oeufs:['Œufs','frais',21,'pc'],creme:['Crème fraîche','frais',10,'cl'],fromage:['Fromage râpé','frais',14,'g'],feta:['Feta','frais',10,'g'],
 mozza:['Mozzarella','frais',4,'pc'],jambon:['Jambon','frais',4,'tranche','m'],lardons:['Lardons','frais',7,'g','m'],brisee:['Pâte brisée','frais',10,'pc'],
 poulet:['Blancs de poulet','viande',3,'g','m'],hache:['Viande hachée','viande',2,'g','m'],saumon:['Pavés de saumon','viande',2,'pc','m'],cabillaud:['Filets de cabillaud','viande',2,'pc','m'],
 oignon:['Oignons','fl',30,'pc'],ail:['Ail','fl',30,'gousse'],tomates:['Tomates','fl',5,'pc'],courgette:['Courgettes','fl',6,'pc'],
 poivron:['Poivrons','fl',7,'pc'],carotte:['Carottes','fl',20,'pc'],pdt:['Pommes de terre','fl',30,'g'],champignons:['Champignons','fl',3,'g'],
 salade:['Salade','fl',4,'pc'],avocat:['Avocats','fl',4,'pc'],citron:['Citrons','fl',14,'pc'],brocoli:['Brocoli','fl',5,'pc'],concombre:['Concombre','fl',6,'pc'],
 petitspois:['Petits pois surgelés','surg',180,'g']
};

export const RECIPES: Recipe[] = [
{id:'carbo',n:'Pâtes carbonara',e:'🍝',t:20,i:[['pates',200],['lardons',150],['oeufs',2],['fromage',50]],s:['Fais cuire les pâtes dans l’eau salée.','Fais dorer les lardons à sec dans une poêle.','Bats les œufs avec le fromage et du poivre.','Égoutte les pâtes en gardant un peu d’eau de cuisson. Hors du feu, mélange avec les lardons puis les œufs. Ajoute un filet d’eau si c’est trop épais.']},
{id:'omelette',n:'Omelette aux champignons',e:'🍳',t:15,i:[['oeufs',5],['champignons',200],['fromage',40],['salade',0.5]],s:['Émince les champignons et fais-les revenir 5 min.','Bats les œufs, sale, poivre, verse sur les champignons.','Parsème de fromage et plie l’omelette quand le dessus est encore baveux.','Sers avec la salade.']},
{id:'currypoulet',n:'Poulet curry coco',e:'🍛',t:30,i:[['poulet',300],['coco',1],['oignon',1],['riz',150]],s:['Lance la cuisson du riz.','Fais revenir l’oignon émincé, ajoute le poulet en dés et 1 c. à soupe de curry.','Verse le lait de coco et laisse mijoter 15 min.','Sers avec le riz.']},
{id:'dahl',n:'Dahl de lentilles corail',e:'🥘',t:30,i:[['lentilles',150],['coco',1],['coulis',200],['oignon',1],['riz',120]],s:['Fais revenir l’oignon avec 1 c. à soupe de curry.','Ajoute les lentilles rincées, le coulis, le lait de coco et 30 cl d’eau.','Laisse cuire 20 min en remuant, jusqu’à ce que ce soit fondant.','Sers avec le riz.']},
{id:'saumon',n:'Saumon, riz et brocoli',e:'🐟',t:25,i:[['saumon',2],['riz',150],['brocoli',1],['citron',1]],s:['Lance le riz. Fais cuire le brocoli 8 min à l’eau ou à la vapeur.','Fais cuire le saumon côté peau 5 min, retourne-le 2 min.','Arrose de citron, sale, poivre.']},
{id:'croque',n:'Croque-monsieur et salade',e:'🥪',t:15,i:[['painmie',8],['jambon',4],['fromage',80],['salade',0.5]],s:['Garnis les tranches de pain de jambon et de fromage.','Fais dorer 10 min au four à 200 °C, ou à la poêle.','Sers avec la salade.']},
{id:'chili',n:'Chili con carne',e:'🌶️',t:35,i:[['hache',300],['haricots',1],['coulis',400],['oignon',1],['poivron',1],['riz',150]],s:['Fais revenir l’oignon et le poivron en dés.','Ajoute la viande et fais-la dorer avec 1 c. à café de cumin ou de piment.','Verse le coulis et les haricots égouttés, laisse mijoter 20 min.','Sers avec le riz.']},
{id:'grecque',n:'Salade grecque',e:'🥗',t:10,i:[['tomates',3],['concombre',1],['feta',150],['oignon',0.5],['pain',1]],s:['Coupe les tomates et le concombre en morceaux, émince finement l’oignon.','Ajoute la feta en dés, de l’huile d’olive, sel, poivre et un peu d’origan.','Sers avec du pain.']},
{id:'wraps',n:'Wraps poulet avocat',e:'🌯',t:20,i:[['tortillas',4],['poulet',250],['avocat',1],['salade',0.5],['tomates',1]],s:['Coupe le poulet en lanières et fais-le dorer 8 min avec du paprika.','Écrase l’avocat avec sel et poivre.','Garnis les tortillas : avocat, salade, tomate, poulet. Roule.']},
{id:'gratinpates',n:'Gratin de pâtes au jambon',e:'🧀',t:30,i:[['pates',200],['jambon',4],['creme',20],['fromage',80]],s:['Fais cuire les pâtes en les gardant un peu fermes.','Mélange-les avec le jambon en morceaux et la crème, verse dans un plat.','Couvre de fromage et enfourne 15 min à 200 °C.']},
{id:'semoule',n:'Semoule, courgettes et pois chiches',e:'🥙',t:20,i:[['courgette',2],['poischiches',1],['semoule',150],['oignon',1],['feta',100]],s:['Fais revenir l’oignon et les courgettes en dés 10 min.','Ajoute les pois chiches égouttés et un peu de cumin.','Verse la semoule dans le même volume d’eau bouillante salée, couvre 5 min puis égraine.','Sers avec la feta émiettée.']},
{id:'cabillaud',n:'Cabillaud et pommes de terre',e:'🐠',t:30,i:[['cabillaud',2],['pdt',500],['citron',1],['creme',10]],s:['Fais cuire les pommes de terre 20 min à l’eau salée.','Fais cuire le cabillaud à la poêle 3 min par face.','Mélange la crème avec le jus du citron pour une sauce rapide.']},
{id:'caprese',n:'Pâtes tomate mozzarella',e:'🍅',t:15,i:[['pates',200],['tomates',3],['mozza',1],['ail',1]],s:['Fais cuire les pâtes.','Fais fondre les tomates en dés avec l’ail haché et de l’huile d’olive 5 min.','Mélange avec les pâtes et la mozzarella en morceaux.']},
{id:'soupe',n:'Soupe de légumes',e:'🥣',t:35,i:[['carotte',3],['pdt',300],['courgette',1],['oignon',1],['pain',1]],s:['Épluche et coupe tous les légumes.','Couvre d’eau avec un cube de bouillon et fais cuire 25 min.','Mixe, ajuste le sel et le poivre. Sers avec du pain.']},
{id:'cantonais',n:'Riz cantonais',e:'🍚',t:20,i:[['riz',150],['oeufs',2],['jambon',2],['petitspois',150]],s:['Fais cuire le riz (encore mieux avec du riz de la veille).','Fais une omelette fine et coupe-la en lanières.','Fais sauter le riz, les petits pois et le jambon en dés. Ajoute l’omelette et un peu de sauce soja.']},
{id:'quiche',n:'Quiche lorraine',e:'🥧',t:45,i:[['brisee',1],['lardons',200],['oeufs',3],['creme',20],['fromage',50],['salade',0.5]],s:['Étale la pâte dans un moule et pique le fond.','Fais revenir les lardons et répartis-les sur la pâte.','Bats les œufs avec la crème et le fromage, verse.','Enfourne 30 min à 190 °C. Sers avec la salade.']},
{id:'poelee',n:'Poêlée de pommes de terre aux lardons',e:'🥔',t:30,i:[['pdt',600],['lardons',150],['oignon',1],['salade',0.5]],s:['Coupe les pommes de terre en petits cubes.','Fais-les dorer 20 min à couvert dans l’huile, en remuant.','Ajoute l’oignon et les lardons, 8 min de plus. Sers avec la salade.']},
{id:'shakshuka',n:'Shakshuka',e:'🥚',t:25,i:[['oeufs',4],['coulis',400],['poivron',1],['oignon',1],['pain',1]],s:['Fais revenir l’oignon et le poivron émincés 8 min.','Ajoute le coulis, du cumin et du paprika, laisse réduire 5 min.','Creuse 4 trous, casse un œuf dans chacun et couvre 6 min.','Sers avec du pain.']},
{id:'burger',n:'Burgers maison',e:'🍔',t:20,i:[['hache',250],['painsburger',2],['tomates',1],['salade',0.5],['fromage',40]],s:['Forme 2 steaks, sale et poivre.','Fais-les cuire 3 à 4 min par face, ajoute le fromage à la fin.','Toaste les pains et garnis de salade, tomate et steak.']},
{id:'pthon',n:'Pâtes au thon et citron',e:'🍋',t:15,i:[['pates',200],['thon',1],['creme',20],['citron',1]],s:['Fais cuire les pâtes.','Chauffe la crème avec le thon émietté et le zeste du citron.','Mélange avec les pâtes, ajoute un filet de jus de citron et du poivre.']},
{id:'tartines',n:'Tartines avocat et œuf',e:'🥑',t:10,i:[['pain',1],['avocat',2],['oeufs',2],['tomates',1]],s:['Fais cuire les œufs 6 min dans l’eau bouillante, puis écale-les.','Toaste le pain et écrase l’avocat dessus avec du sel.','Ajoute l’œuf coupé et la tomate en tranches.']},
{id:'risotto',n:'Risotto aux champignons',e:'🍄',t:35,i:[['riz',160],['champignons',250],['oignon',1],['fromage',50]],s:['Fais revenir l’oignon, ajoute le riz (rond si possible) et remue 2 min.','Verse petit à petit 70 cl de bouillon chaud en remuant, pendant 18 min.','Pendant ce temps, fais dorer les champignons.','Hors du feu, mélange le tout avec le fromage.']},
{id:'pouletfour',n:'Poulet et légumes au four',e:'🍗',t:40,i:[['poulet',300],['pdt',400],['carotte',2],['oignon',1]],s:['Coupe les légumes et le poulet en morceaux.','Mélange dans un plat avec de l’huile, du sel, du poivre et des herbes.','Enfourne 35 min à 200 °C en remuant à mi-cuisson.']}
];

export const RBY: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
