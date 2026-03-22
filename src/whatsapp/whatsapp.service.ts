import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
} from 'baileys';
import { Boom } from '@hapi/boom';
import { PrismaService } from 'src/prisma.service';
import * as qrcode from 'qrcode-terminal';
const { sendButtons  } = require('baileys_helpers');

@Injectable()
export class WhatsappService implements OnModuleInit {
    constructor(private readonly pris: PrismaService) {}
    private readonly logger = new Logger(WhatsappService.name);
    public socket: any;
    public qrCode: string | null = null;
    public ConnectionStatus: string = 'disconnected';

    async onModuleInit() {
        await this.connectToWhatsApp();
    }


    async connectToWhatsApp() {
        const { state, saveCreds } = await useMultiFileAuthState('./session/my-bot');
        const nestLogger = new Logger('Baileys');
        this.socket = makeWASocket({
            auth: state, 
            logger: require('pino')({ level: 'error' }), 
            version: [2, 3000, 1033936837] 
        });

        this.socket.ev.on('creds.update', saveCreds);

        this.socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // this.qrCode = qr;
                qrcode.generate(qr, { small: true });
                this.logger.log(`QR Code received: ${qr}`);
                this.ConnectionStatus = 'disconnected';
            }

            if (connection === 'open') {
                this.logger.log('Koneksi Berhasil!');
                this.ConnectionStatus = 'connected';
                this.qrCode = null;
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.logger.error(`Koneksi terputus karena ${lastDisconnect?.error}, mencoba hubungkan kembali: ${shouldReconnect}`);
                if (shouldReconnect) {
                    this.connectToWhatsApp();
                }
                this.ConnectionStatus = 'disconnected'; 
            }
        });

        this.socket.ev.on('messages.upsert', async (m) => {
            // if(m.type === 'notify') {
            //     for (const msg of m.messages) {
            //         if(!msg.key.fromMe) {
            //             this.logger.log(`Pesan baru dari ${msg.key.remoteJid}: ${msg.message?.conversation}`);
            //         }
            //     }
            // }

            const msg = m.messages[0];
            const remoteJid = this.getPNJid(msg);
            if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
                this.logger.log(`Pesan baru dari ${remoteJid}: ${msg.message.conversation || msg.message.extendedTextMessage.text}`);
            }
        });
    }

    async sendMessage(to: string, message: string) {
        const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
        await this.socket.sendMessage(jid, { text: message + '\n\n*Powered by Jilpa*' });
    }

    // async sendOtp(to: string, otp: string) {
    //     const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
    //     await sendInteractiveMessage(this.socket, jid, {
    //         text: `Kode OTP Anda: ${otp}`,
    //         interactiveButtons: [
    //             { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy OTP', copy_code: otp }) },,
    //         ]
    //     });
    // }

    async sendOtp(phone: string, otp: string) {
        const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;

        const payload = {
            text: `Kode OTP Anda adalah ${otp}`,
            footer: '*Powered by Jilpa*',
            buttons: [
            { 
                name: 'cta_copy', 
                buttonParamsJson: JSON.stringify({ 
                display_text: 'Salin Kode', 
                copy_code: otp 
                }) 
            }
            ]
        };

        // Pastikan 'this.socket' adalah instance Baileys yang aktif
        return await sendButtons(this.socket, jid, payload);
    }

    getPNJid(msg) {
        const { remoteJid, remoteJidAlt } = msg.key;
        if (remoteJid?.endsWith("@s.whatsapp.net")) return remoteJid;
        if (remoteJidAlt?.endsWith("@s.whatsapp.net")) return remoteJidAlt;
        return null;
    }
}
