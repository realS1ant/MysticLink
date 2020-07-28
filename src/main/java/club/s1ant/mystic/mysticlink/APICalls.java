package club.s1ant.mystic.mysticlink;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class APICalls {
    private static APICalls instance;
    private MysticLink main = MysticLink.getInstance();

    public String getUserCode(UUID uuid) {
        try {
            URL url = new URL(MysticLink.apiLink+"/link?uuid="+uuid);
            URLConnection con = url.openConnection();
            JSONParser jsonParser = new JSONParser();
            JSONObject jsonObject = (JSONObject) jsonParser.parse(
                    new InputStreamReader((InputStream) con.getContent(), StandardCharsets.UTF_8)
            );
            String message = jsonObject.get("message").toString();
            if(message.equalsIgnoreCase("Okay")){
                return jsonObject.get("code").toString();
            }
            return message;
        } catch(Exception e){
            main.getLogger().severe("API may be down!");
            e.printStackTrace();
            return "internal error";
        }
    }

    public boolean isLinked(UUID uuid){
        try {
            URL url = new URL(MysticLink.apiLink+"/islinked/"+uuid);
            URLConnection con = url.openConnection();
            JSONParser jsonParser = new JSONParser();
            JSONObject jsonObject = (JSONObject) jsonParser.parse(
                    new InputStreamReader((InputStream) con.getContent(), StandardCharsets.UTF_8)
            );
            return Boolean.getBoolean(jsonObject.get("message").toString());
        } catch(Exception e){
            main.getLogger().severe("API may be down!");
            e.printStackTrace();
            return false;
        }
    }

    public static APICalls getInstance() {
        if(instance == null) instance = new APICalls();
        return instance;
    }
}
