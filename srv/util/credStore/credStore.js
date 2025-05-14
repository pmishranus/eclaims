const fetch = require("node-fetch");
const jose = require("node-jose");

// Utility to check HTTP response status
function checkStatus(response) {
    if (!response.ok) throw Error("Unexpected status code: " + response.status);
    return response;
}

// Decrypt JWE payload using private key
async function decryptPayload(privateKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PRIVATE KEY-----${privateKey}-----END PRIVATE KEY-----`, "pem", {
        alg: "RSA-OAEP-256",
        enc: "A256GCM"
    });

    const decrypt = await jose.JWE.createDecrypt(key).decrypt(payload);
    return decrypt.plaintext.toString();
}

// Encrypt a payload using public key
async function encryptPayload(publicKey, payload) {
    const key = await jose.JWK.asKey(`-----BEGIN PUBLIC KEY-----${publicKey}-----END PUBLIC KEY-----`, "pem", {
        alg: "RSA-OAEP-256"
    });

    const options = {
        contentAlg: "A256GCM",
        compact: true,
        fields: {
            iat: Math.floor(Date.now() / 1000)
        }
    };

    return jose.JWE.createEncrypt(options, key).update(Buffer.from(payload, "utf8")).final();
}

// Build headers for SAP CP credential store
function buildHeaders(binding, namespace, initHeaders = {}) {
    const headers = new fetch.Headers(initHeaders);
    headers.set("Authorization", `Basic ${Buffer.from(`${binding.username}:${binding.password}`).toString("base64")}`);
    headers.set("sapcp-credstore-namespace", namespace);
    return headers;
}

// Fetch and decrypt a response
async function fetchAndDecrypt(privateKey, url, method, headers, body) {
    const response = await fetch(url, { method, headers, body });
    checkStatus(response);
    const payload = await response.text();
    const decrypted = await decryptPayload(privateKey, payload);
    return JSON.parse(decrypted);
}

// Read credential from the store
async function readCredential(binding, namespace, type, name) {
    return fetchAndDecrypt(
        binding.encryption.client_private_key,
        `${binding.url}/${type}?name=${encodeURIComponent(name)}`,
        "get",
        buildHeaders(binding, namespace)
    );
}

// Write credential to the store
async function writeCredential(binding, namespace, type, credential) {
    const encrypted = await encryptPayload(binding.encryption.server_public_key, JSON.stringify(credential));
    return fetchAndDecrypt(
        binding.encryption.client_private_key,
        `${binding.url}/${type}`,
        "post",
        buildHeaders(binding, namespace, { "Content-Type": "application/jose" }),
        encrypted
    );
}

// Delete credential from the store
async function deleteCredential(binding, namespace, type, name) {
    const response = await fetch(
        `${binding.url}/${type}?name=${encodeURIComponent(name)}`,
        {
            method: "delete",
            headers: buildHeaders(binding, namespace)
        }
    );
    checkStatus(response);
}

// Export all functions
module.exports = {
    checkStatus,
    decryptPayload,
    encryptPayload,
    buildHeaders,
    fetchAndDecrypt,
    readCredential,
    writeCredential,
    deleteCredential
};
