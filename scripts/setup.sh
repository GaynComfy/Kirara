#!/bin/sh

cp .env.example .env.dev
rm -rf context
mkdir context
cd context
git clone https://github.com/GaynComfy/midori
