package club.s1ant.mystic.mysticlink;

import net.md_5.bungee.api.plugin.Plugin;

public class MysticLink extends Plugin{

    private static MysticLink instance;
    public static String discordLink = "https://api.mysticgames.us/discord";
    public static String apiLink = "https://api.mysticgames.us/api";

    @Override
    public void onEnable() {
        instance = this;
        getProxy().getPluginManager().registerCommand(this, new LinkCommand());
    }

    public static MysticLink getInstance(){
        return instance;
    }
}
