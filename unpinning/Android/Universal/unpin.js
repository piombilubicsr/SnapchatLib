const certificate = "user_cert_here\n"
Java.perform(function () {
	var SettingSecureClass = Java.use('android.provider.Settings$Secure');

	SettingSecureClass.getString.overload('android.content.ContentResolver', 'java.lang.String').implementation = function (context, name) {
		if (name.includes('android_id')) {
			var retval = this.getString(context, name);
			console.log("Invoke get androidId, with result : " + retval);

			var fake_value = "92ca0898227fec15"
			return fake_value;

		} else {
			var retval = this.getString(context, name);
			return retval;
		}
	};
});


// HTTP(S)
function hookSsl() {
    Java.perform(function () {
        console.log('[*] Script started');
    
        var certificateArray = Java.use('[Ljava.lang.String;');
        var JavaString = Java.use('java.lang.String');
        var myCertificate = JavaString.$new(certificate);
    
        var HookedClass = Java.use('java.security.cert.CertificateFactory');
        const InputStream = Java.use('java.io.ByteArrayInputStream');
        var inStreamCertificate = InputStream.$new(myCertificate.getBytes());
    
        var done = false;
    
        HookedClass.generateCertificate.implementation = function (inStream) {
            if(!done) {
                console.log("[*] Successfully changed the certificate");
                done = true;
                return this.generateCertificate(inStreamCertificate);
            }
    
            return this.generateCertificate(inStream);
        };

        console.log("[*] SSL pinning should be disabled.");	
    });
}

// Chat
function hookSslTwo() {
    Java.perform(function () {
        var SSLContext = Java.use("javax.net.ssl.SSLContext");
        var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
        var TrustManager = Java.registerClass({
            name: 'com.sensepost.test.TrustManager',
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function(chain, authType) {},
                checkServerTrusted: function(chain, authType) {},
                getAcceptedIssuers: function() {
                    return [];
                }
            }
        });
        var TrustManagers = [TrustManager.$new()];
        var SSLContext_init = SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');

        try {
            // Override the init method, specifying our new TrustManager
            SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
                console.log("[+] Overriding SSLContext.init() with the custom TrustManager android < 7");
                SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
            };
        } catch (err) {
            console.log("[-] TrustManager Not Found");
        }
    });
}

hookSsl();
hookSslTwo();