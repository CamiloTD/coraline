const io = require('socket.io');
const Config = require('./config.json');
const Channel = require('./channel');

const CONNECTED = 0x00;
const DISCONNECTED = 0x01;

class Server {
	
	constructor (port) {
		this.server = io();
		this.port = port;
		this.channels = {};

		this.server.on('connection',  (sock) => {

			sock.on('create-channel', (config, pass) => {
				if(pass !== Config.password) return sock.emit('cannot-create-channel');

				let chan = this.createChannel(config, sock);

				sock.join(chan.id);
				sock.emit('channel-created', chan.id);
			});

			sock.on('join-channel', (id, pass) => {
				let chan = this.channels[id];

				if(!chan) return sock.emit("invalid-channel", id);
				if(pass !== chan.password) return sock.emit("incorrect-channel-password", id);

				if(chan.isFull()) return sock.emit('channel-full', id);
				if(chan.clients.has(sock)) return sock.emit('channel-has-client', id);

				chan.joinClient(sock);

				sock.emit('channel-join-success', id);
			});
		});
	}

	listen () {
		this.server.listen(this.port)
	}

	close (cb) {
		return new Promise((done, err) => this.server.close((error) => error? err(error) : done()));
	}

	createChannel (config, master) {
		let id = config.name;
		while(this.channels[id]) {
			id = config.name + "-" + (Math.floor(Math.random() * 90) + 10);
		}

		let chan = this.channels[id] = new Channel(config, master);
		chan.id = id;

		return chan;
	}
}

function configureSock (sock) {
}

module.exports = Server;