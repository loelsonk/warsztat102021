## AWS CloudFront w praktyce

![](https://miro.medium.com/max/1400/0*5zpkNFoKi9tBRkKH.png)

### Agenda

1. [Wprowadzenie do CloudFront](#ad-1-wprowadzenie-do-cloudfront)
1. [Lambda Edge Functions](#ad-3-lambda-edge-functions)
1. [Konfiguracja Dystrybucji CF](#ad-4-konfiguracja-dystrybucji-cf)
1. [Przykładowe use-casy](#ad-5-przyk%C5%82adowe-use-casy)
1. [Demo, serwowanie assetów na przykładzie sitemap](#ad-6-demo-serwowanie-asset%C3%B3w-na-przyk%C5%82adzie-sitemap)
1. [Podsumowanie](#ad-7-podsumowanie)
----

### Ad 1. Wprowadzenie do CloudFront

Czym jest CF wg dokumentacji w wolnym tłumaczeniu

> Amazon CloudFront to rozproszony system dostarczania treści (CDN), który bezpiecznie dostarcza dane, filmy, aplikacje i interfejsy API klientom na całym świecie z niewielkimi opóźnieniami i wysokimi prędkościami transferu, a wszystko to w środowisku przyjaznym dla programistów.

#### Problem z którym CloudFront może nam pomóc

Załóżmy, że mamy stronę internetową zainstalowaną na polskim hostingu, np. może być to datacenter w Warszawie.

![](single-server-1.png)

Wszyscy są zadowoleni. Strona działa szybko bez opóźnień, hosting nie jest obciążony zapytaniami. 

Problem może się pojawić, kiedy strona zyska na popularności. Klienci z sąsiednich krajów czują opóźnienie ale mogą w miarę skutecznie poruszać się po stronie, natomiast w bardziej odległych zakątkach świata na wyświetlenie strony czekamy kilka sekund.

![](single-server-2.png)

przeniesc do podsumowania

- częste zapytania obciążające zasoby obliczeniowe, pamięciowe servera, bazy danych
- spora odległość od klientów, długie czasy oczekiwania
- może doprowadzić do strat wizerunkowych i finansowych związanych z niedotrzymaniem SLA, czyli Service Level Agreement – umowa o gwarantowanym poziomie świadczenia usług.

#### CDN/CloudFront rozwiązuje ten problem w taki oto sposób:

![](https://gtmetrix.com/blog/wp-content/uploads/2017/02/cdn-example.png)
*źródło https://gtmetrix.com*

![](https://gtmetrix.com/blog/wp-content/uploads/2017/02/cdn-region-specific.png)
*źródło https://gtmetrix.com*

#### Integracje CF

- [Amazon Lambda](https://aws.amazon.com/lambda/) umożliwia tzw. przetwarzanie bezserwerowe(serverless computing), uruchamianie kodu aplikacji bez konieczności samodzielnego zarządzania serwerem 
- [Amazon Kinesis Data Streams](https://aws.amazon.com/kinesis/data-streams/) w połączeniu z CF umożliwia przetwarzanie logów w czasie rzeczywistym
- [Amazon CloudWatch](https://aws.amazon.com/cloudwatch/) Monitoring. CF współpracuje z CW, emituje różnego rodzaju metryki.
- [Amazon Route 53](https://aws.amazon.com/route53/)
- [Amazon Simple Storage Service (S3)](https://aws.amazon.com/s3/)
- [AWS Certificate Manager (ACM)](https://aws.amazon.com/certificate-manager/) umożliwia dodanie certyfikatu SSL do Dystrybucji CF i powiązanie go z nasza domeną.
- [AWS Shield](https://aws.amazon.com/shield/)
- [AWS Web Application Firewall (WAF)](https://aws.amazon.com/waf/)

![](integracje-cf.png)

----

### Ad 3. Lambda Edge Functions

![](https://images.ctfassets.net/9gzi1io5uqx8/mdGKV0XGOGjyr23h3ExMP/99f70f024f70f9856af20e300aea7a03/cloudfront-function-and-lambda-edge-2.png?fit=scale&w=825)

linki:
- https://www.sentiatechblog.com/cloudfront-functions-and-lambda-edge-compared

----

### Ad 4. Konfiguracja Dystrybucji CF

GraphQL codegen posłuży nam do wygenerowania
- typów typescript
- na podstawie pliku `operations.graphql` wygenerujemy
    - `codegen-typescript-react-apollo-api.ts` gotowe do użycia otypowane hooki operacji (query/mutation) `@apollo/client`
    - `codegen-typescript-react-query-api.ts` gotowe do użycia otypowane hooki `react-query`
    
1. Dodajemy do projektu [graphql-codegen](https://github.com/dotansimha/graphql-code-generator)
   jako dev dependency 
```
yarn add -D graphql @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo @graphql-codegen/typescript-react-query @graphql-codegen/typescript-type-graphql
```

2. Tworzymy plik `codegen.yml` w roocie projektu o zwartości
```yaml
schema: https://g9n41.sse.codesandbox.io/graphql
documents: ./operations.graphql
config:
  fetcher:
    endpoint: https://g9n41.sse.codesandbox.io/graphql
    fetchParams:
      headers:
        Content-Type: application/json
generates:
  ./src/graphql-codegen-react-query-api.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-query
  ./src/graphql-codegen-apollo-api.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

3. W package.json możemy dodać
```json
{
  "scripts": {
    "graphql-codegen": "graphql-codegen"
  }
}
```
4. Wykonujemy skrypt, w `./src` dir zostaną dodane 2 nowe pliki
```
yarn graphql-codegen
```

linki:
- https://www.graphql-code-generator.com/ ciekawy playground na głównej stronie
- https://www.graphql-code-generator.com/docs/plugins/index dokumentacja dostępnych pluginów
----

### Ad 5. Przykładowe use-casy

Kiedy CloudFront może nam się przydać:

- Przyspieszenie dostarczania statycznych zawartości strony (wszelkie assety)
- Chcemy serwować prywatne treści, np. korporacyjne dostępne tylko dla ludzi zalogowanych do VPN(np. poprzez ograniczenie IP Lambda @Edge, AWS WAF)
- Wprowadzenie customowych stron np. dla poszczególnych kodów błędów HTTP lub gdy wykonywany jest maintance strony
- live streaming, np. twitch.tv

linki:
- https://rohan6820.medium.com/aws-case-study-twitch-324ecf8288aa
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/IntroductionUseCases.html

----

### Ad 6. Demo, serwowanie assetów na przykładzie sitemap

#### Postman

Wspomaganie na przykładzie importowania [schema.json](https://g9n41.sse.codesandbox.io/v3/docs/swagger.json) swaggera do postmana

1. Klikamy `Import` z pliku lub linku
1. Profit, w `Collections` otrzymujemy pogrupowane i sparametryzowane endpointy
1. Pozostaje tylko przygotowanie środowiska dla zaimportowanego API i gotowe

Link do webinaru z Tłustego czwartku [APIs 101 with Postman (for Beginners) [ENG]](https://billenniumspzoo.sharepoint.com/sites/HR/LearningAndDevelopment/SitePages/Szkolenia/pl/Akademia-wiedzy.aspx#apis-101-with-postman-%28for-beginners%29
)

#### Altair

Altair to aktualnie najlepszy playground do GraphQL. 
Podobny w użytkowaniu do Postmana, który to do GraphQL nie nadaje się z jednego powodu
- braku automatycznego odświeżania schemy po jej zmianie, nie jest wykorzystywana introspekcja doców.
- schemę musimy w Postmanie kopiować ręcznie, aby mieć namiastkę introspekcji

#### Generatory OAS do GraphQL
Istnieją generatory mapujące OAS na schemę GraphQL - SDL, czy corowy obiekt `GraphQLSchema`

Przy bardziej złożonych schemach OAS nie będziemy w stanie zmapować 1:1
Generator z pewnością może nam pomóc w developmencie, ale nie możemy zakładać, że wykona za nas całą robotę.

Sprawdziłem 3 biblioteki do rzutowania OAS v2 v3
- `swagger-to-graphql` (jedynie OAS v2)
- `swagql`
- `openapi-to-graphql`

i najlepiej radzi sobie `openapi-to-graphql`

----

### Ad. 7. Podsumowanie


#### Wady braku posiadania CDN

- częste zapytania obciążające zasoby obliczeniowe, pamięciowe servera, bazy danych
- spora odległość od klientów, długie czasy oczekiwania
- może doprowadzić do strat wizerunkowych i finansowych związanych z niedotrzymaniem SLA, czyli Service Level Agreement – umowa o gwarantowanym poziomie świadczenia usług.

#### Kiedy warto stosować CDN?

- często odwiedzane strony internetowe
  - o zasięgu ogólnopolskim
  - wielojęzyczne/z zagranicznym ruchem
  - sklepy internetowe
- strony z dużą ilością plików, assetów, zdjęć, filmów, itd.
- strony narażone na ataki 
   – popularne
   - zarabiające serwisy
   -  przechowujące cenne dane
- każda inna dowolna strona WWW, która z pewnych powodów ma być szybsza i mieć w 100% profesjonalną architekturę

#### Dlaczego warto użyc CloudFront?

- Szybkość i niezawodność w dostarczaniu treści do klientów
- Bezpieczeństwo
- Głęboka i łatwa integracja z ekosystemem AWS
- Wygodna konfiguracja za pomocą API/SDK/narzędzi Infrastructure as a Code(IaC) np. Terraform, Serverless framework, AWS SAM
- Przetwarzanie żądań i odpowiedzi @Edge za pomocą kodu AWS Lambda Edge Functions, CloudFront Functions
- Metryki i logi dostępne w czasie rzeczywistym (CloudTrail, CloudWatch)

#### Do poczytania / Linki

- https://www.youtube.com/watch?v=16CShhniGcA

![](https://i.imgur.com/RrzBX7A.png)



----




