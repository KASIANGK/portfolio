# React + Vite

- Tests :
    - Rafraichissement et redirection pages :
        - si je suis "/" -> "/"
        - si je suis "/city" -> '/'
    - Verification localStorage :
        - Step 1 / HomeOverlay - page + hint
        - StepsHomeCity 
    - Verif LanguageToast Navbar:
        - pop-up de changement partout 3sec SAUF dans Step1 HomerOverlay
    - Double comportement de la navbar

- Modif :
    - StepsHomeCity, STEP1 - pas danimation mais affichee directement
    - bg HomeOverlay - STEP1 et STEP2
    - 3D / User marche pendant 1.2 sec et puis il court 
    - StepsHomeCity visuel des tests + STEP 2 - progressbar plus courte 1.2s
    - FullScreenLoader ETA1 a modif content

- A realiser :
    - MiniMapHUD
    - possibilite dajouter brume sur scene ?
    - Position Empties Blender
    - Collisions Blender
    - supprimer les details de la porte "transparente" batiment Blender
    - Markers + message devant la poubelle, devant escaliers.
    - json i18n dans :
        - HomeOverlay, 
        - StepsHomeCity 
        - HomeCity

- Implementation :
    - About Section - 
        sorte de tableau excel ou premiere ligne horizontale -div avec 4 attributs - WebDev/3D/Graphism/Events et la seconde ligne - div qui adapte le contenu en fonction de lelement preselectionne
    - Projects Menu
    - Contact


VERIF PAR PAGE :
- Header-Step1/HomeOverlay :
    - auto rafraichir
    - hint
    - btn - hover smooth + arrows
    - style
    - commmandes btn - space, click, enter
    - bg
- Header-Step1/HomeOverlay :