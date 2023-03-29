# Sirona

Card game Helper Discord bot with some extra things and more to come.

Sirona might be referred to as "Kirara" too.

# Invite the Official instance

[Invite](https://discord.com/oauth2/authorize?client_id=748100524246564894&permissions=415001603136&scope=bot)

# General Info

Running this bot locally will currently lead to issues since Authorization keys and other components would be missing, making those features optional so that the bot runs without them is planned!

## Running locally

Currently this will not work due to "midori" missing as a component, but once detached, the easiest way is to use [Docker](https://www.docker.com/products/docker-desktop/), after installing:
Copy .env.example to .env.dev and fill values

Then execute the following which will build and run the bot:

```sh
docker-compose up --build
```

## Todos

- [ ] Make the bot runnable without shoob access
- [ ] Some code cleanup

# License

This Project is licensed under [GNU AFFERO GENERAL PUBLIC LICENSE v3](LICENSE)
