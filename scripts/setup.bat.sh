#!/bin/sh

copy .env.example .env.dev
rmdir /S context
mkdir context
cd context
git clone https://github.com/GaynComfy/midori
