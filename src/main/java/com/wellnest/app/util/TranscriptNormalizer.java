package com.wellnest.app.util;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TranscriptNormalizer {

    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String res = text.toLowerCase().trim();

        // 1. Standardize unit spelling and typos
        res = res.replaceAll("\\b(ghnte|gnhta|ghnta|ghanta|ghante|ghnt|ghanto|ghantein|hours|hr|hrs|ghata|ghatain)\\b", "hour");
        res = res.replaceAll("\\b(minut|minuts|minute|minutes|min|mins|mnt|mnts|mints|mint)\\b", "minute");
        res = res.replaceAll("\\b(paani|pani)\\b", "water");
        res = res.replaceAll("\\b(botal)\\b", "bottle");
        res = res.replaceAll("\\b(gilaas|gilas)\\b", "glass");
        res = res.replaceAll("\\b(kadam)\\b", "step");

        // 2. ASR Transcription Typos mapping
        res = res.replaceAll("\\b(sava|swa|shawa|sawaa)\\b", "sawa")
                 .replaceAll("\\b(derh|deedh|deth)\\b", "dedh")
                 .replaceAll("\\b(dhayi|dhaye|adhai)\\b", "dhai")
                 .replaceAll("\\b(adha|adhe|aadhe)\\b", "aadha")
                 .replaceAll("\\b(pauna|paund|paune)\\b", "paun");

        // 3. Narrow homophone scoping to prevent replacing verbs ("to run")
        // Converts "to/too" -> "2" only when directly preceding a quantity unit
        res = res.replaceAll("\\b(to|too)\\s+(glass|gilaas|gilas|roti|apple|seb|banana|kela|bottle|botal|shake|bread|step|kadam|hour|minute|min|ghante|ghanta|km|kilometer|kilometre)\\b", "2 $2");

        return res;
    }
}
