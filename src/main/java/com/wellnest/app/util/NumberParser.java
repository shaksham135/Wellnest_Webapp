package com.wellnest.app.util;

import lombok.extern.slf4j.Slf4j;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class NumberParser {

    public static String resolveNumbers(String text) {
        if (text == null) {
            return "";
        }
        String res = text;

        // 1. Basic Hindi/English digit mapping (descending order of length to prevent partial replacement)
        res = res.replaceAll("\\bpeentalis|peintis|paitis\\b", "35")
                 .replaceAll("\\bpeintalis|peentalis\\b", "45")
                 .replaceAll("\\bchaubees\\b", "24")
                 .replaceAll("\\bchattis\\b", "36")
                 .replaceAll("\\bchiyalis\\b", "46")
                 .replaceAll("\\bseintalis\\b", "47")
                 .replaceAll("\\bteintalis\\b", "43")
                 .replaceAll("\\bchavalis\\b", "44")
                 .replaceAll("\\biktalis\\b", "41")
                 .replaceAll("\\bbayalis\\b", "42")
                 .replaceAll("\\buntalis\\b", "39")
                 .replaceAll("\\bsattavan\\b", "57")
                 .replaceAll("\\batthavan\\b", "58")
                 .replaceAll("\\bchouvan\\b", "54")
                 .replaceAll("\\bpachpan\\b", "55")
                 .replaceAll("\\bchappan\\b", "56")
                 .replaceAll("\\bikyavan\\b", "51")
                 .replaceAll("\\bgyarah\\b", "11")
                 .replaceAll("\\bbarah\\b", "12")
                 .replaceAll("\\bterah\\b", "13")
                 .replaceAll("\\bchaudah\\b", "14")
                 .replaceAll("\\bpandrah\\b", "15")
                 .replaceAll("\\bsolah\\b", "16")
                 .replaceAll("\\bsatrah\\b", "17")
                 .replaceAll("\\bathrah\\b", "18")
                 .replaceAll("\\bunnis\\b", "19")
                 .replaceAll("\\bikkis\\b", "21")
                 .replaceAll("\\bbaais\\b", "22")
                 .replaceAll("\\bbees\\b", "20")
                 .replaceAll("\\bchaalis|chalis\\b", "40")
                 .replaceAll("\\bpachas|pachaas\\b", "50")
                 .replaceAll("\\bsaath\\b", "60")
                 .replaceAll("\\bteen\\b", "3")
                 .replaceAll("\\bchar|chaar\\b", "4")
                 .replaceAll("\\bpaanch|panch\\b", "5")
                 .replaceAll("\\bche|chheh\\b", "6")
                 .replaceAll("\\bsaat\\b", "7")
                 .replaceAll("\\baath\\b", "8")
                 .replaceAll("\\bnau\\b", "9")
                 .replaceAll("\\bdas\\b", "10")
                 .replaceAll("\\bdo\\b", "2")
                 .replaceAll("\\bek\\b", "1")
                 .replaceAll("\\bthirteen\\b", "13")
                 .replaceAll("\\bfourteen\\b", "14")
                 .replaceAll("\\bfifteen\\b", "15")
                 .replaceAll("\\beleven\\b", "11")
                 .replaceAll("\\btwelve\\b", "12")
                 .replaceAll("\\btwentynine\\b", "29")
                 .replaceAll("\\btwenty\\b", "20")
                 .replaceAll("\\bthirty\\b", "30")
                 .replaceAll("\\bforty\\b", "40")
                 .replaceAll("\\bfifty\\b", "50")
                 .replaceAll("\\bsixty\\b", "60")
                 .replaceAll("\\bthree\\b", "3")
                 .replaceAll("\\bfour\\b", "4")
                 .replaceAll("\\bfive\\b", "5")
                 .replaceAll("\\bsix\\b", "6")
                 .replaceAll("\\bseven\\b", "7")
                 .replaceAll("\\beight\\b", "8")
                 .replaceAll("\\bnine\\b", "9")
                 .replaceAll("\\bten\\b", "10")
                 .replaceAll("\\btwo\\b", "2")
                 .replaceAll("\\bone\\b", "1");

        // 2. Hindi composite prefixes (sade, sawa, paune)
        Pattern sadePattern = Pattern.compile("\\b(sade|saade|sarhe|sadhe)\\s+(\\d+(?:\\.\\d+)?)\\b");
        Matcher sadeMatcher = sadePattern.matcher(res);
        while (sadeMatcher.find()) {
            double val = Double.parseDouble(sadeMatcher.group(2)) + 0.5;
            res = res.replace(sadeMatcher.group(0), String.valueOf(val));
            sadeMatcher = sadePattern.matcher(res);
        }

        Pattern sawaPattern = Pattern.compile("\\b(sawa|sava|sawaa)\\s+(\\d+(?:\\.\\d+)?)\\b");
        Matcher sawaMatcher = sawaPattern.matcher(res);
        while (sawaMatcher.find()) {
            double val = Double.parseDouble(sawaMatcher.group(2)) + 0.25;
            res = res.replace(sawaMatcher.group(0), String.valueOf(val));
            sawaMatcher = sawaPattern.matcher(res);
        }

        Pattern paunePattern = Pattern.compile("\\b(paune|pauni|pauney|paun)\\s+(\\d+(?:\\.\\d+)?)\\b");
        Matcher pauneMatcher = paunePattern.matcher(res);
        while (pauneMatcher.find()) {
            double val = Double.parseDouble(pauneMatcher.group(2)) - 0.25;
            res = res.replace(pauneMatcher.group(0), String.valueOf(val));
            pauneMatcher = paunePattern.matcher(res);
        }

        // 3. Standalone fractions
        res = res.replaceAll("\\b(aadha|aadhe|adha|adhe|half)\\b", "0.5")
                 .replaceAll("\\b(paun|pauna|paund|paunda)\\b", "0.75")
                 .replaceAll("\\b(sawa|sava|sawaa)\\b", "1.25")
                 .replaceAll("\\b(dedh|deedh|derh|deth)\\b", "1.5")
                 .replaceAll("\\b(dhai|dhayi|adhai)\\b", "2.5");

        // 4. English composite fractions
        res = res.replaceAll("\\bquarter\\b", "0.25");
        res = res.replaceAll("\\bek\\s+aur\\s+0\\.5\\b", "1.5")
                 .replaceAll("\\b1\\s+and\\s+0\\.5\\b", "1.5")
                 .replaceAll("\\b(\\d+)\\s+and\\s+0\\.5\\b", "$1.5")
                 .replaceAll("\\b(\\d+)\\s+and\\s+0\\.25\\b", "$1.25");

        return res;
    }
}
