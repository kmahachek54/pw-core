FROM mcr.microsoft.com/playwright:v1.29.0-focal

ARG BROWSER

RUN mkdir e2e
WORKDIR /e2e
COPY . .
RUN yarn
RUN if [ "$BROWSER" = "edge" ]; then npx playwright install msedge; fi
RUN if [ "$BROWSER" = "chrome" ]; then npx playwright install chrome; fi
