
// Templates data
const templates = [
    {
        name: "Exemple Vide",
        code: `Algorithme MonAlgorithme;
Var

Const

Debut

Fin`
    },
	// NIVEAU 1 - TRÈS FACILE (Calculs Simples, pas de boucles)
    {
        name: "Carré - Surface",
        code: `Algorithme SurfaceCarre;
Var
    cote, surface: Reel;
Debut
    Ecrire("Entrez le côté du carré:");
    Lire(cote);
    
    surface <- cote * cote;
    
    Ecrire("La surface du carré est:", surface);
Fin`
    },
    {
        name: "Rect. : Surf./Périm.",
        code: `Algorithme RectangleSurfacePerimetre;
Var
    longueur, largeur, surface, perimetre: Reel;
Debut
    Ecrire("Entrez la longueur du rectangle:");
    Lire(longueur);
    Ecrire("Entrez la largeur du rectangle:");
    Lire(largeur);
    
    surface <- longueur * largeur;
    perimetre <- 2 * (longueur + largeur);
    
    Ecrire("Surface du rectangle:", surface);
    Ecrire("Périmètre du rectangle:", perimetre);
Fin`
    },
    {
        name: "Calcul Moyenne",
        code: `Algorithme CalculMoyenne;
Var
    note1, note2, note3, moyenne: Reel;
Debut
    Ecrire("Entrez trois notes:");
    Lire(note1, note2, note3);
    
    moyenne <- (note1 + note2 + note3) / 3;
    
    Ecrire("La moyenne est:", moyenne);
    
    Si moyenne >= 10 alors
        Ecrire("Félicitations, vous avez réussi!");
    SiNon
        Ecrire("Vous devez vous améliorer.");
    FinSi
Fin`
    },
    {
        name: "Conversion Température",
        code: `Algorithme ConversionTemperature;
Var
    choix: Entier;
    celsius, fahrenheit: Reel;
Debut
    Ecrire("Conversion de température");
    Ecrire("1- Celsius vers Fahrenheit");
    Ecrire("2- Fahrenheit vers Celsius");
    Ecrire("Entrez votre choix (1 ou 2):");
    
    Lire(choix);
    
    Si choix = 1 alors
        Ecrire("Entrez la température en Celsius:");
        Lire(celSius);
        fahrenheit <- (celSius * 9/5) + 32;
        Ecrire(celSius, "°C équivaut à", fahrenheit, "°F");
    SiNon
        Si choix = 2 alors
            Ecrire("Entrez la température en Fahrenheit:");
            Lire(fahrenheit);
            celSius <- (fahrenheit - 32) * 5/9;
            Ecrire(fahrenheit, "°F équivaut à", celSius, "°C");
        SiNon
            Ecrire("Choix invalide");
        FinSi
    FinSi
Fin`
    },
    {
        name: "Calcul Cercle",
        code: `Algorithme CalculCercle;
Var
    rayon, surface, circonference: Reel;
Const
    PI = 3.14159;
Debut
    Ecrire("Entrez le rayon du cercle:");
    Lire(rayon);
    
    surface <- PI * rayon * rayon;
    circonference <- 2 * PI * rayon;
    
    Ecrire("Surface du cercle:", surface);
    Ecrire("Circonférence du cercle:", circonference);
Fin`
    },
    {
        name: "Equation 1er Degré",
        code: `Algorithme EquationPremierDegre;
Var
    a, b, x: Reel;
Debut
    Ecrire("Résolution de l'équation ax + b = 0");
    Ecrire("Entrez la valeur de a:");
    Lire(a);
    Ecrire("Entrez la valeur de b:");
    Lire(b);
    
    Si a = 0 alors
        Si b = 0 alors
            Ecrire("L'équation admet une inFinité de solutions");
        SiNon
            Ecrire("L'équation n'admet pas de solution");
        FinSi
    SiNon
        x <- -b / a;
        Ecrire("La solution est x =", x);
    FinSi
Fin`
    },
    
    // NIVEAU 2 - FACILE (Boucles Simples)
    {
        name: "Afficher Nombres",
        code: `Algorithme AfficherNombres;
Var
    nbLimite, i: Entier;
Debut
    Ecrire("Entrer un nombre limite:");
    Lire(nbLimite);
    
    Pour i de 1 a nbLimite faire
        Ecrire(i);
    FinPour
Fin`
    },
    {
        name: "Nombres Pairs",
        code: `Algorithme NombresPairs;
Var
    n, i: Entier;
Debut
    Ecrire("Entrez la valeur limite n:");
    Lire(n);
    
    Ecrire("Nombres pairs de 0 à", n, ":");
    
    Pour i de 0 a n pas 2 faire
        Ecrire(i);
    FinPour
Fin`
    },
    {
        name: "Nombres Impairs",
        code: `Algorithme NombreSimpairs;
Var
    n, i: Entier;
Debut
    Ecrire("Entrez la valeur limite n:");
    Lire(n);
    
    Ecrire("Nombres impairs de 1 à", n, ":");
    
    Pour i de 1 a n pas 2 faire
        Ecrire(i);
    FinPour
Fin`
    },
    {
        name: "Table Multiplication",
        code: `Algorithme TableMultiplication;
Var
    nombre, i, resultat: Entier;
Debut
    Ecrire("Quelle table voulez-vous afficher?");
    Lire(nombre);
    
    Pour i de 1 a 10 faire
        resultat <- nombre * i;
        Ecrire(nombre, "x", i, "=", resultat);
    FinPour
Fin`
    },
    {
        name: "Somme 10 Nombres",
        code: `Algorithme Somme10;
Var
    i, valeurEntree, somme: Entier;
Debut
    somme <- 0;
    
    Pour i de 1 a 10 faire
        Ecrire("Entrer un nombre:");
        Lire(valeurEntree);
        somme <- somme + valeurEntree;
    FinPour
    
    Ecrire("La somme est:", somme);
Fin`
    },
    {
        name: "Somme N Nombres",
        code: `Algorithme SommeN;
Var
    n, i, nombre, somme: Entier;
Debut
    Ecrire("Combien de nombres voulez-vous additionner?");
    Lire(n);
    
    somme <- 0;
    Pour i de 1 a n faire
        Ecrire("Entrez le nombre", i, ":");
        Lire(nombre);
        somme <- somme + nombre;
    FinPour
    
    Ecrire("La somme des", n, "nombres est:", somme);
Fin`
    },
	{
		name: "Mot de passe",
		code: `Algorithme MotDePasse;
Var
    mot : chaine;
Debut
    Ecrire("Veuillez saisir le mot de passe :");
    Lire(mot);

    TantQue mot != "0000" faire
        Ecrire("Mot de passe incorrect. Veuillez réessayer :");
        Lire(mot);
    FinTantQue

    Ecrire("Mot de passe correct. Bienvenue !");
Fin`
		
	},
    {
        name: "Factoriel",
        code: `Algorithme Factoriel;
Var
    n, fact, i: Entier;
Debut
    Ecrire("Entrez un nombre Pour calculer sa factorielle:");
    Lire(n);
    
    fact <- 1;
    
    Pour i de 1 a n faire
        fact <- fact * i;
    FinPour
    
    Ecrire("La factorielle de", n, "est", fact);
Fin`
    },
    
    // NIVEAU 3 - MOYEN (Boucles avec conditions)
    {
        name: "Recherche Maximum",
        code: `Algorithme RechercheMaximum;
Var
    n, nombre, maximum, i: Entier;
Debut
    Ecrire("Combien de nombres voulez-vous comparer?");
    Lire(n);
    
    Ecrire("Entrez le nombre 1:");
    Lire(nombre);
    maximum <- nombre;
    i <- 2;
    
    TantQue i <= n faire
        Ecrire("Entrez le nombre", i, ":");
        Lire(nombre);
        
        Si nombre > maximum alors
            maximum <- nombre;
        FinSi
        
        i <- i + 1;
    FinTantQue
    
    Ecrire("Le maximum est:", maximum);
Fin`
    },
    {
        name: "Palindrome",
        code: `Algorithme VerificationPalindrome;
Var
    nombre, copie, inverse, chiffre: Entier;
Debut
    Ecrire("Entrez un nombre:");
    Lire(nombre);
    
    copie <- nombre;
    inverse <- 0;
    
    TantQue copie > 0 faire
        chiffre <- copie mod 10;
        inverse <- inverse * 10 + chiffre;
        copie <- copie div 10;
    FinTantQue
    
    Si nombre = inverse alors
        Ecrire(nombre, "est un palindrome");
    SiNon
        Ecrire(nombre, "n est pas un palindrome");
    FinSi
Fin`
    },
    {
        name: "Décimal vers Binaire",
        code: `Algorithme DecimalVersBinaire;
Var
    nombreDecimal, binaire, reste, multiplicateur: Entier;
Debut
    Ecrire("Entrez un nombre entier en base décimale:");
    Lire(nombreDecimal);
    
    binaire <- 0;
    multiplicateur <- 1;
    
    TantQue nombreDecimal <> 0 faire
        reste <- nombreDecimal mod 2;
        binaire <- binaire + (reste * multiplicateur);
        nombreDecimal <- nombreDecimal div 2;
        multiplicateur <- multiplicateur * 10;
    FinTantQue
    
    Ecrire("Représentation binaire:", binaire);
Fin`
    },
    {
        name: "MotDePass 3 Essais",
        code: `Algorithme MotDePasse;
Var
    mot : chaine;
    essai : Entier;
Debut
    essai <- 1;

    TantQue essai <= 3 et mot != "0000" faire
        Ecrire("Entrez le mot de passe :");
        Lire(mot);

        Si mot != "0000" alors
            Ecrire("Mot de passe incorrect.");
        FinSi

        essai <- essai + 1;
    FinTantQue

    Si mot = "0000" alors
        Ecrire("Accès autorisé.");
    SiNon
        Ecrire("Accès refusé.");
    FinSi
Fin`
	},
    {
        name: "Fibonacci",
        code: `Algorithme SuiteFibonacci;
Var
    n, i, a, b, c: Entier;
Debut
    Ecrire("Combien de termes de la suite de Fibonacci voulez-vous?");
    Lire(n);
    
    Ecrire("Suite de Fibonacci:");
    
    Si n >= 1 alors
        Ecrire(0);
    FinSi
    
    Si n >= 2 alors
        Ecrire(1);
    FinSi
    
    a <- 0;
    b <- 1;
    
    Pour i de 3 a n faire
        c <- a + b;
        Ecrire(c);
        a <- b;
        b <- c;
    FinPour
Fin`
    },
    {
        name: "Calcul PGCD",
        code: `Algorithme CalculPGCD;
Var
    a, b, r: Entier;
Debut
    Ecrire("Entrez le premier nombre:");
    Lire(a);
    Ecrire("Entrez le deuxième nombre:");
    Lire(b);
    
    Si a < b alors
        r <- a;
        a <- b;
        b <- r;
    FinSi
    
    TantQue b <> 0 faire
        r <- a mod b;
        a <- b;
        b <- r;
    FinTantQue
    
    Ecrire("Le PGCD est:", a);
Fin`
    },
    {
        name: "Equation 2nd Degré",
        code: `Algorithme EquationSecondDegre;
Var
    a, b, c, delta, x1, x2: reel;
Debut
    Ecrire("Résolution de l'équation ax² + bx + c = 0");
    Ecrire("Entrez la valeur de a:");
    Lire(a);
    Ecrire("Entrez la valeur de b:");
    Lire(b);
    Ecrire("Entrez la valeur de c:");
    Lire(c);
    
    Si a = 0 alors
        Si b = 0 alors
            Si c = 0 alors
                Ecrire("L'équation admet une infinité de solutions");
            SiNon
                Ecrire("L'équation n'admet pas de solution");
            FinSi
        SiNon
            x1 <- -c / b;
            Ecrire("L'équation est du premier degré, la solution est x =", x1);
        FinSi
    SiNon
        delta <- b * b - 4 * a * c;
        
        Si delta < 0 alors
            Ecrire("L'équation n'admet pas de solution réelle");
        SiNon
            Si delta = 0 alors
                x1 <- -b / (2 * a);
                Ecrire("L'équation admet une solution double: x =", x1);
            SiNon
                x1 <- (-b - racine(delta)) / (2 * a);
                x2 <- (-b + racine(delta)) / (2 * a);
                Ecrire("L'équation admet deux solutions:");
                Ecrire("x1 =", x1);
                Ecrire("x2 =", x2);
            FinSi
        FinSi
    FinSi
Fin`
    },
    
    // NIVEAU 4 - DIFFICILE (Boucles imbriquées)
    {
        name: "Calcul PPCM",
        code: `Algorithme CalculPPCM;
Var
    a, b, pgcd, ppcm: Entier;
    temp_a, temp_b, r: Entier;
Debut
    Ecrire("Entrez le premier nombre:");
    Lire(a);
    Ecrire("Entrez le deuxième nombre:");
    Lire(b);
    
    temp_a <- a;
    temp_b <- b;
    
    Si a < b alors
        r <- a;
        a <- b;
        b <- r;
    FinSi
    
    tantque b <> 0 faire
        r <- a mod b;
        a <- b;
        b <- r;
    FinTantQue
    
    pgcd <- a;
    ppcm <- (temp_a * temp_b) / pgcd;
    
    Ecrire("Le PPCM est:", ppcm);
Fin`
    },
    {
        name: "Nombres Premiers",
        code: `Algorithme NombresPremiers;
var
    n, i, j, temp: Entier;
    estPremier: Booleen;
debut
    Ecrire("Entrez la limite N:");
    Lire(n);
    
    Ecrire("Nombres premiers jusqu'à", n, ":");
    
    pour i de 2 a n faire
        estPremier <- vrai;
        
        pour j de 2 a i-1 faire
            temp <- i mod j;
            Si temp = 0 alors
                estPremier <- faux;
                sortir;
            FinSi
        Finpour
        
        Si estPremier = vrai alors
            Ecrire(i);
        FinSi
    finpour
Fin`
    }
];
