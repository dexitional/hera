export class SystemAlertEngine {
    
    private static slackUrl = process.env.SLACK_WEBHOOK_URL;
    private static discordUrl = process.env.DISCORD_WEBHOOK_URL;
  
    /**
     * Dispatches critical architectural metrics straight to your communication channels
    **/
    static async dispatchCriticalAlert({ title, message, severity, metadata }: {
      title: string;
      message: string;
      severity: 'WARNING' | 'CRITICAL' | 'INFO';
      metadata?: Record<string, any>;
    }) {
      const timestamp = new Date().toISOString();
      const color = severity === 'CRITICAL' ? 15158332 : severity === 'WARNING' ? 15105570 : 3447003; // Hex colors for Discord
  
      // 1. Dispatch Asynchronously via out-of-band nextTick execution
      process.nextTick(async () => {
        try {
          // A) Deliver payload to Discord webhook channel
          if (this.discordUrl) {
            await fetch(this.discordUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: 'VPS Security Sentinel',
                embeds: [{
                  title: `🚨 ${title}`,
                  description: message,
                  color: color,
                  fields: [
                    { name: 'Severity', value: severity, inline: true },
                    { name: 'Timestamp', value: timestamp, inline: true },
                    { name: 'Diagnostics', value: `\`\`\`json\n${JSON.stringify(metadata || {}, null, 2)}\n\`\`\`` }
                  ]
                }]
              })
            });
          }
  
          // B) Deliver payload to Slack webhook channel
          if (this.slackUrl) {
            await fetch(this.slackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `*🚨 ${title}*\n*Severity:* ${severity}\n*Message:* ${message}\n\`\`\`json\n${JSON.stringify(metadata || {}, null, 2)}\n\`\`\``
              })
            });
          }
        } catch (err) {
          console.error('Critical notification delivery architecture failed:', err);
        }
      });
    }
  }
  