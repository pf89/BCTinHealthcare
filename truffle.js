module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        development: {
            host: "10.50.0.2",
            port: 22000,
            network_id: "*",
            gasPrice: 0,
            gas: 4500000,
            gaslimit: 300000000,
            from: "0x9acc69a7a5e8c4f7cac378f6b0140fb4deba218d"
        }
    }
};
