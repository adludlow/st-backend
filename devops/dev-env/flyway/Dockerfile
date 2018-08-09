FROM java:8

ARG FLYWAY_VERSION=5.1.4

RUN apt-get update && apt-get install -f -y postgresql-client
COPY wait-for-pg.sh /wait-for-pg.sh

ADD https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/$FLYWAY_VERSION/flyway-commandline-$FLYWAY_VERSION-linux-x64.tar.gz /flyway.tar.gz
RUN tar -xzf /flyway.tar.gz && \
rm flyway.tar.gz && \
mv flyway-$FLYWAY_VERSION /flyway && \
ln -s /flyway/flyway /usr/local/bin/flyway

WORKDIR /flyway
ENTRYPOINT ["flyway"]
CMD ["--help"]

