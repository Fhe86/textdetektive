/*
 * Textdetektive: alle Texte und Lösungen.
 *
 * So ergänzt du einen Text:
 *  - Sätze stehen als Text in einer Liste "saetze".
 *  - Marker-Wörter stehen in [eckigen Klammern]. Mehrere Wörter in einer Klammer
 *    sind alle Marker-Wörter, zum Beispiel [sieben Euro].
 *  - Satzzeichen bleiben außerhalb der Klammer: [Hund] bellt.
 *  - Fragen: { frage, optionen: [...], richtig: Nummer der richtigen Option, 0 beginnt }.
 *  - Ein Eintrag in "einheiten" ist eine Übung. Mit "saetze" gibt es eine Markier-Aufgabe,
 *    mit "fragen" kommen danach die Ankreuz-Fragen, mit "ampel" die Selbsteinschätzung.
 *  - "zaehlt: false" bei einer Einheit bedeutet: nicht in der Auswertung mitzählen.
 */
window.TEXTDETEKTIVE = {
  version: 1,
  speicherSchluessel: "textdetektive-v1",
  maxMarkerProSatz: 3,
  maxZusatzProSatz: 2,
  stufen: [
    {
      id: "stufe1",
      nummer: "1",
      titel: "Stufe 1",
      untertitel: "6 einzelne Sätze",
      einheitName: "Sätzen",
      einheiten: [
        { id: "s1-1", titel: "Satz 1", saetze: ["[Lena] [kauft] im Supermarkt drei [Äpfel]."] },
        { id: "s1-2", titel: "Satz 2", saetze: ["Der [Hund] bellt laut im [Garten]."] },
        { id: "s1-3", titel: "Satz 3", saetze: ["Am [Samstag] spielt [Tim] [Fußball]."] },
        { id: "s1-4", titel: "Satz 4", saetze: ["Das [Handy] hat keinen [Akku] mehr."] },
        { id: "s1-5", titel: "Satz 5", saetze: ["Die [Pizza] kostet [sieben Euro]."] },
        { id: "s1-6", titel: "Satz 6", saetze: ["Im [Winter] [schlafen] [Igel] unter Laub."] }
      ]
    },
    {
      id: "stufe2",
      nummer: "2",
      titel: "Stufe 2",
      untertitel: "Texte A bis C",
      einheitName: "Aufgaben",
      einheiten: [
        {
          id: "a",
          titel: "Text A: Mayas Handy",
          saetze: [
            "[Maya] hat ein [neues] [Handy].",
            "Sie nutzt es jeden Tag [zwei] [Stunden].",
            "Abends legt sie es in die [Küche]."
          ],
          fragen: [
            {
              frage: "Wo liegt das Handy abends?",
              optionen: ["In der Küche", "Im Schlafzimmer", "In der Schultasche"],
              richtig: 0
            }
          ]
        },
        {
          id: "b",
          titel: "Text B: Der Igel",
          saetze: [
            "Der [Igel] ist ein kleines Tier.",
            "Er frisst [Käfer] und [Würmer].",
            "Im [Winter] [schläft] er im [Laub]."
          ],
          fragen: [
            {
              frage: "Was frisst der Igel?",
              optionen: ["Äpfel und Nüsse", "Gras und Blätter", "Käfer und Würmer"],
              richtig: 2
            }
          ]
        },
        {
          id: "c",
          titel: "Text C: Jonas und Handball",
          saetze: [
            "[Jonas] spielt [Handball].",
            "Das Training ist [dienstags] um [17] [Uhr].",
            "Er braucht [Hallenschuhe]."
          ],
          fragen: [
            {
              frage: "Wann ist das Training?",
              optionen: ["Montags um 17 Uhr", "Dienstags um 17 Uhr", "Dienstags um 15 Uhr"],
              richtig: 1
            }
          ]
        }
      ]
    },
    {
      id: "stufe3",
      nummer: "3",
      titel: "Stufe 3",
      untertitel: "Texte D und E",
      einheitName: "Aufgaben",
      einheiten: [
        {
          id: "d",
          titel: "Text D: Pizza",
          saetze: [
            "Pizza kommt aus [Italien].",
            "Dort backen Pizzabäcker sie im [Steinofen].",
            "Die Pizza ist [dünn] und [knusprig].",
            "Früher aßen vor allem [arme] [Leute] Pizza.",
            "Heute essen Menschen auf der [ganzen] [Welt] Pizza.",
            "In Deutschland ist [Tiefkühlpizza] sehr beliebt."
          ],
          fragen: [
            {
              frage: "Woher kommt die Pizza?",
              optionen: ["Aus Italien", "Aus Spanien", "Aus Deutschland"],
              richtig: 0
            },
            {
              frage: "Wer aß früher Pizza?",
              optionen: ["Nur Könige", "Arme Leute", "Reiche Leute"],
              richtig: 1
            }
          ]
        },
        {
          id: "e",
          titel: "Text E: Delfine",
          saetze: [
            "Delfine leben im [Meer].",
            "Sie sind [keine] [Fische], sondern [Säugetiere].",
            "Delfine [atmen] [Luft].",
            "Dafür [tauchen] sie immer wieder [auf].",
            "Sie verständigen sich mit [Pfeiftönen].",
            "Delfine leben in [Gruppen]."
          ],
          fragen: [
            {
              frage: "Sind Delfine Fische?",
              optionen: ["Ja, sie sind Fische.", "Nein, sie sind Säugetiere."],
              richtig: 1
            },
            {
              frage: "Warum tauchen Delfine immer wieder auf?",
              optionen: ["Sie suchen Futter.", "Sie atmen Luft.", "Sie spielen gern."],
              richtig: 1
            }
          ]
        }
      ]
    },
    {
      id: "lerncheck",
      nummer: "Check",
      titel: "Lern-Check",
      untertitel: "Zeig, was du kannst",
      einheitName: "Aufgaben",
      einheiten: [
        {
          id: "lc1",
          titel: "Aufgabe 1",
          anweisung: "Markiere in diesem Satz die Marker-Wörter.",
          saetze: ["Am [Freitag] fahren wir mit dem [Bus] zum [Schwimmbad]."]
        },
        {
          id: "lc2",
          titel: "Aufgabe 2",
          fragen: [
            {
              frage: "Ein Marker-Wort ist ...",
              optionen: [
                "ein Wort, das lang ist",
                "ein Wort, das wichtig ist",
                "das erste Wort im Satz"
              ],
              richtig: 1
            }
          ]
        },
        {
          id: "lc3",
          titel: "Aufgabe 3",
          fragen: [
            {
              frage: "Wozu markiere ich Wörter?",
              optionen: [
                "Damit der Text schön bunt wird.",
                "Damit ich das Wichtige schnell wiederfinde."
              ],
              richtig: 1
            }
          ]
        },
        {
          id: "lc4",
          titel: "Aufgabe 4",
          ampel: "Ich kann Marker-Wörter finden.",
          zaehlt: false
        }
      ]
    }
  ],
  ampelStufen: [
    { id: "gruen", wort: "Grün", text: "Das kann ich.", farbe: "#3E8E6B" },
    { id: "gelb", wort: "Gelb", text: "Das kann ich fast.", farbe: "#FFE14D" },
    { id: "rot", wort: "Rot", text: "Das übe ich noch.", farbe: "#B5604F" }
  ],
  schritte: [
    "Erst lesen, noch nicht markieren.",
    "Frage stellen: Wer? Was? Wo? Wann?",
    "Marker-Wörter markieren, höchstens 3 pro Satz.",
    "Streich-Test: Verstehe ich es noch?"
  ]
};
