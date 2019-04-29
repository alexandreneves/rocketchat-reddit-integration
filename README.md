# Rocket.Chat Reddit integration

## INSTALL

1. add a new **Outgoing WebHook** integration
2. fill form:
    - **event trigger**: Message Sent
    - **enabled**: true
    - **trigger words**: !reddit
    - **url**: https://reddit.com
    - **script enabled**: true
    - **script**: copy *./dist/index.js* source
3. save and enjoy
