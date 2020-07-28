package club.s1ant.mystic.mysticlink;

import net.md_5.bungee.api.ChatColor;
import net.md_5.bungee.api.CommandSender;
import net.md_5.bungee.api.chat.ClickEvent;
import net.md_5.bungee.api.chat.TextComponent;
import net.md_5.bungee.api.connection.ProxiedPlayer;
import net.md_5.bungee.api.plugin.Command;

public class LinkCommand extends Command {

    public LinkCommand(){
        super("discord", "", "discordlink", "linkdiscord");
    }

    @Override
    public void execute(CommandSender commandSender, String[] strings) {
        if(!(commandSender instanceof ProxiedPlayer)) return;
        String output = APICalls.getInstance().getUserCode((((ProxiedPlayer) commandSender).getUniqueId()));
        String link = "";
        switch (output.toLowerCase()) {
            case "unauthorized!":
                commandSender.sendMessage(new TextComponent(ChatColor.RED + "Authorization Error, Notify an Administrator!"));
                return;
            case "already linked!":
                commandSender.sendMessage(new TextComponent(ChatColor.RED + "Hey! You're already linked!"));
                return;
            case "no uuid specified!":
            case "internal error":
                commandSender.sendMessage(new TextComponent(ChatColor.RED + "Uh oh! There was an error! Try again later."));
                return;
            default:
                link = MysticLink.discordLink + output;
        }
        TextComponent linkText = new TextComponent(ChatColor.BLUE + "" + ChatColor.BOLD + MysticLink.discordLink);
        linkText.setClickEvent(new ClickEvent(ClickEvent.Action.OPEN_URL, link));
        TextComponent message = new TextComponent(ChatColor.GREEN + "" + ChatColor.BOLD + "To link your Discord " +
                "and Minecraft accounts visit this link: ");
        message.addExtra(linkText);
        commandSender.sendMessage(message);
    }
}
