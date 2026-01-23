
// Templates data
const templates = [
    {
        name: "Example Vide",
        code: `Algorithme MonAlgorithme;
Var

Const

Debut

Fin`
    },
	// NIVEAU 1 - TRÈS FACILE (Calculs simples, pas de boucles)
    {
        name: "Carré - Surface",
        code: `Algorithme SurfaceCarre;
Var
    cote, surface: reel;
Debut
    ecrire("Entrez le côté du carré:");
    lire(cote);
    
    surface <- cote * cote;
    
    ecrire("La surface du carré est:", surface);
Fin`
    },
    {
        name: "Rectangle - Surface et Périmètre",
        code: `Algorithme RectangleSurfacePerimetre;
Var
    longueur, largeur, surface, perimetre: reel;
Debut
    ecrire("Entrez la longueur du rectangle:");
    lire(longueur);
    ecrire("Entrez la largeur du rectangle:");
    lire(largeur);
    
    surface <- longueur * largeur;
    perimetre <- 2 * (longueur + largeur);
    
    ecrire("Surface du rectangle:", surface);
    ecrire("Périmètre du rectangle:", perimetre);
Fin`
    },
    {
        name: "Calcul Moyenne",
        code: `Algorithme CalculMoyenne;
Var
    note1, note2, note3, moyenne: reel;
Debut
    ecrire("Entrez trois notes:");
    lire(note1, note2, note3);
    
    moyenne <- (note1 + note2 + note3) / 3;
    
    ecrire("La moyenne est:", moyenne);
    
    si moyenne >= 10 alors
        ecrire("Félicitations, vous avez réussi!");
    sinon
        ecrire("Vous devez vous améliorer.");
    finsi
Fin`
    },
    {
        name: "Conversion Température",
        code: `Algorithme ConversionTemperature;
Var
    choix: entier;
    celsius, fahrenheit: reel;
Debut
    ecrire("Conversion de température");
    ecrire("1- Celsius vers Fahrenheit");
    ecrire("2- Fahrenheit vers Celsius");
    ecrire("Entrez votre choix (1 ou 2):");
    
    lire(choix);
    
    si choix = 1 alors
        ecrire("Entrez la température en Celsius:");
        lire(celsius);
        fahrenheit <- (celsius * 9/5) + 32;
        ecrire(celsius, "°C équivaut à", fahrenheit, "°F");
    sinon
        si choix = 2 alors
            ecrire("Entrez la température en Fahrenheit:");
            lire(fahrenheit);
            celsius <- (fahrenheit - 32) * 5/9;
            ecrire(fahrenheit, "°F équivaut à", celsius, "°C");
        sinon
            ecrire("Choix invalide");
        finsi
    finsi
Fin`
    },
    {
        name: "Calcul Cercle",
        code: `Algorithme CalculCercle;
Var
    rayon, surface, circonference: reel;
Const
    PI = 3.14159;
Debut
    ecrire("Entrez le rayon du cercle:");
    lire(rayon);
    
    surface <- PI * rayon * rayon;
    circonference <- 2 * PI * rayon;
    
    ecrire("Surface du cercle:", surface);
    ecrire("Circonférence du cercle:", circonference);
Fin`
    },
    {
        name: "Equation 1er Degré",
        code: `Algorithme EquationPremierDegre;
Var
    a, b, x: reel;
Debut
    ecrire("Résolution de l'équation ax + b = 0");
    ecrire("Entrez la valeur de a:");
    lire(a);
    ecrire("Entrez la valeur de b:");
    lire(b);
    
    si a = 0 alors
        si b = 0 alors
            ecrire("L'équation admet une infinité de solutions");
        sinon
            ecrire("L'équation n'admet pas de solution");
        finsi
    sinon
        x <- -b / a;
        ecrire("La solution est x =", x);
    finsi
Fin`
    },
    
    // NIVEAU 2 - FACILE (Boucles simples)
    {
        name: "Afficher Nombres",
        code: `Algorithme AfficherNombres;
Var
    nbLimite, i: entier;
Debut
    ecrire("Entrer un nombre limite:");
    lire(nbLimite);
    
    pour i de 1 a nbLimite faire
        ecrire(i);
    finpour
Fin`
    },
    {
        name: "Nombres Pairs",
        code: `Algorithme NombresPairs;
Var
    n, i: entier;
Debut
    ecrire("Entrez la valeur limite n:");
    lire(n);
    
    ecrire("Nombres pairs de 0 à", n, ":");
    
    pour i de 0 a n pas 2 faire
        ecrire(i);
    finpour
Fin`
    },
    {
        name: "Nombres Impairs",
        code: `Algorithme NombresImpairs;
Var
    n, i: entier;
Debut
    ecrire("Entrez la valeur limite n:");
    lire(n);
    
    ecrire("Nombres impairs de 1 à", n, ":");
    
    pour i de 1 a n pas 2 faire
        ecrire(i);
    finpour
Fin`
    },
    {
        name: "Table Multiplication",
        code: `Algorithme TableMultiplication;
Var
    nombre, i, resultat: entier;
Debut
    ecrire("Quelle table voulez-vous afficher?");
    lire(nombre);
    
    pour i de 1 a 10 faire
        resultat <- nombre * i;
        ecrire(nombre, "x", i, "=", resultat);
    finpour
Fin`
    },
    {
        name: "Somme 10 Nombres",
        code: `Algorithme Somme10;
Var
    i, valeurEntree, somme: entier;
Debut
    somme <- 0;
    
    pour i de 1 a 10 faire
        ecrire("Entrer un nombre:");
        lire(valeurEntree);
        somme <- somme + valeurEntree;
    finpour
    
    ecrire("La somme est:", somme);
Fin`
    },
    {
        name: "Somme N Nombres",
        code: `Algorithme SommeN;
Var
    n, i, nombre, somme: entier;
Debut
    ecrire("Combien de nombres voulez-vous additionner?");
    lire(n);
    
    somme <- 0;
    pour i de 1 a n faire
        ecrire("Entrez le nombre", i, ":");
        lire(nombre);
        somme <- somme + nombre;
    finpour
    
    ecrire("La somme des", n, "nombres est:", somme);
Fin`
    },
    {
        name: "Factoriel",
        code: `Algorithme Factoriel;
Var
    n, fact, i: entier;
Debut
    ecrire("Entrez un nombre pour calculer sa factorielle:");
    lire(n);
    
    fact <- 1;
    
    pour i de 1 a n faire
        fact <- fact * i;
    finpour
    
    ecrire("La factorielle de", n, "est", fact);
Fin`
    },
    
    // NIVEAU 3 - MOYEN (Boucles avec conditions)
    {
        name: "Recherche Maximum",
        code: `Algorithme RechercheMaximum;
Var
    n, nombre, maximum, i: entier;
Debut
    ecrire("Combien de nombres voulez-vous comparer?");
    lire(n);
    
    ecrire("Entrez le nombre 1:");
    lire(nombre);
    maximum <- nombre;
    i <- 2;
    
    tantque i <= n faire
        ecrire("Entrez le nombre", i, ":");
        lire(nombre);
        
        si nombre > maximum alors
            maximum <- nombre;
        finsi
        
        i <- i + 1;
    fintantque
    
    ecrire("Le maximum est:", maximum);
Fin`
    },
    {
        name: "Palindrome",
        code: `Algorithme VerificationPalindrome;
Var
    nombre, copie, inverse, chiffre: entier;
Debut
    ecrire("Entrez un nombre:");
    lire(nombre);
    
    copie <- nombre;
    inverse <- 0;
    
    tantque copie > 0 faire
        chiffre <- copie mod 10;
        inverse <- inverse * 10 + chiffre;
        copie <- copie div 10;
    fintantque
    
    si nombre = inverse alors
        ecrire(nombre, "est un palindrome");
    sinon
        ecrire(nombre, "n'est pas un palindrome");
    finsi
Fin`
    },
    {
        name: "Décimal vers Binaire",
        code: `Algorithme DecimalVersBinaire;
Var
    nombreDecimal, binaire, reste, multiplicateur: entier;
Debut
    ecrire("Entrez un nombre entier en base décimale:");
    lire(nombreDecimal);
    
    binaire <- 0;
    multiplicateur <- 1;
    
    tantque nombreDecimal <> 0 faire
        reste <- nombreDecimal mod 2;
        binaire <- binaire + (reste * multiplicateur);
        nombreDecimal <- nombreDecimal div 2;
        multiplicateur <- multiplicateur * 10;
    fintantque
    
    ecrire("Représentation binaire:", binaire);
Fin`
    },
    {
        name: "Fibonacci",
        code: `Algorithme SuiteFibonacci;
Var
    n, i, a, b, c: entier;
Debut
    ecrire("Combien de termes de la suite de Fibonacci voulez-vous?");
    lire(n);
    
    ecrire("Suite de Fibonacci:");
    
    si n >= 1 alors
        ecrire(0);
    finsi
    
    si n >= 2 alors
        ecrire(1);
    finsi
    
    a <- 0;
    b <- 1;
    
    pour i de 3 a n faire
        c <- a + b;
        ecrire(c);
        a <- b;
        b <- c;
    finpour
Fin`
    },
    {
        name: "Calcul PGCD",
        code: `Algorithme CalculPGCD;
Var
    a, b, r: entier;
Debut
    ecrire("Entrez le premier nombre:");
    lire(a);
    ecrire("Entrez le deuxième nombre:");
    lire(b);
    
    si a < b alors
        r <- a;
        a <- b;
        b <- r;
    finsi
    
    tantque b <> 0 faire
        r <- a mod b;
        a <- b;
        b <- r;
    fintantque
    
    ecrire("Le PGCD est:", a);
Fin`
    },
    {
        name: "Equation 2nd Degré",
        code: `Algorithme EquationSecondDegre;
Var
    a, b, c, delta, x1, x2: reel;
Debut
    ecrire("Résolution de l'équation ax² + bx + c = 0");
    ecrire("Entrez la valeur de a:");
    lire(a);
    ecrire("Entrez la valeur de b:");
    lire(b);
    ecrire("Entrez la valeur de c:");
    lire(c);
    
    si a = 0 alors
        si b = 0 alors
            si c = 0 alors
                ecrire("L'équation admet une infinité de solutions");
            sinon
                ecrire("L'équation n'admet pas de solution");
            finsi
        sinon
            x1 <- -c / b;
            ecrire("L'équation est du premier degré, la solution est x =", x1);
        finsi
    sinon
        delta <- b * b - 4 * a * c;
        
        si delta < 0 alors
            ecrire("L'équation n'admet pas de solution réelle");
        sinon
            si delta = 0 alors
                x1 <- -b / (2 * a);
                ecrire("L'équation admet une solution double: x =", x1);
            sinon
                x1 <- (-b - racine(delta)) / (2 * a);
                x2 <- (-b + racine(delta)) / (2 * a);
                ecrire("L'équation admet deux solutions:");
                ecrire("x1 =", x1);
                ecrire("x2 =", x2);
            finsi
        finsi
    finsi
Fin`
    },
    
    // NIVEAU 4 - DIFFICILE (Boucles imbriquées)
    {
        name: "Calcul PPCM",
        code: `Algorithme CalculPPCM;
Var
    a, b, pgcd, ppcm: entier;
    temp_a, temp_b, r: entier;
Debut
    ecrire("Entrez le premier nombre:");
    lire(a);
    ecrire("Entrez le deuxième nombre:");
    lire(b);
    
    temp_a <- a;
    temp_b <- b;
    
    si a < b alors
        r <- a;
        a <- b;
        b <- r;
    finsi
    
    tantque b <> 0 faire
        r <- a mod b;
        a <- b;
        b <- r;
    fintantque
    
    pgcd <- a;
    ppcm <- (temp_a * temp_b) / pgcd;
    
    ecrire("Le PPCM est:", ppcm);
Fin`
    },
    {
        name: "Nombres Premiers",
        code: `Algorithme NombresPremiers;
var
    n, i, j, temp: entier;
    estPremier: booleen;
debut
    ecrire("Entrez la limite N:");
    lire(n);
    
    ecrire("Nombres premiers jusqu'à", n, ":");
    
    pour i de 2 a n faire
        estPremier <- vrai;
        
        pour j de 2 a i-1 faire
            temp <- i mod j;
            si temp = 0 alors
                estPremier <- faux;
                sortir;
            finsi
        finpour
        
        si estPremier = vrai alors
            ecrire(i);
        finsi
    finpour
Fin`
    }
];
