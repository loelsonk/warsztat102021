## AWS CloudFront w praktyce


AWS CloudFront w praktyce

Agenda
1. Wprowadzenie do CloudFront
2. Amazon S3, o bucketach po krótce
3. Lambda Edge Functions
4. Konfiguracja Dystrybucji CF
5. Przykładowe use-casy
6. Demo, serwowanie assetów na przykładzie sitemap
7. Podsumowanie



### Agenda

1. [Wprowadzenie do CloudFront](#ad-1-wprowadzenie-do-cloudfront)
1. [Amazon S3, o bucketach po krótce](#ad-2-amazon-s3-o-bucketach-po-kr%C3%B3tce)
1. [Lambda Edge Functions](#ad-3-lambda-edge-functions)
1. [Konfiguracja Dystrybucji CF](#ad-4-konfiguracja-dystrybucji-cf)
1. [Przykładowe use-casy](#ad-5-przyk%C5%82adowe-use-casy)
1. [Demo, serwowanie assetów na przykładzie sitemap](#ad-6-demo-serwowanie-asset%C3%B3w-na-przyk%C5%82adzie-sitemap)
1. [Podsumowanie](#ad-7-podsumowanie)
   
----

### Ad 1. Wprowadzenie do CloudFront

Czym jest CF wg dokumentacji w wolnym tłumaczeniu

> Amazon CloudFront to rozproszony system dostarczania treści (CDN), która bezpiecznie dostarcza dane, filmy, aplikacje i interfejsy API klientom na całym świecie z niewielkimi opóźnieniami i wysokimi prędkościami transferu, a wszystko to w środowisku przyjaznym dla programistów.

#### Ok, ale czym jest CDN?

![](single-server-1.png)
![](single-server-2.png)

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

### Ad 2. Amazon S3, o bucketach po krótce

- Sandbox https://codesandbox.io/s/tsed-swagger-graphql-092021-g9n41
- Potrzebujesz jedynie instancji bazy danych mongodb, darmową możesz założyć na https://www.mongodb.com/cloud (btw. mlab.com został przejęty przez mongodb.com)
- Server stoi na frameworku TS.ED https://tsed.io
- Server działa całkiem spoko w developmencie. W razie pytań to lojalnie informuję, że nie wykorzystywałem go nigdy produkcyjnie. Wypróbowałem go jedynie przy okazji realizacji tego warszatu.

#### process.env.MONGO_URL
W zakładce `Server Control Panel` ustawiamy zmienną środowiską `process.env.MONGO_URL`, aby wskazywała na connection string naszej bazy.
Connection string powinien wyglądać mniej więcej tak:
`mongodb+srv://<username>:<password>@<cluster-name>.<random-subdomain>.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

![Jak dodać secret](images/add-secret.png "Jak dodać secret")

#### Jak pobrać projekt
![Jak exportować](images/how-to-export.png "Jak exportować")

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

codesandbox aplikacji frontowej:
https://codesandbox.io/s/gifted-bird-go7vs

![](https://img.ifunny.co/images/abc5076a024122ffa0174065886821b15a905856dc6595619db482812e531d2f_1.webp)

linki:
- https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm/ Apollo Devtools

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


#### Dlaczego warto użyc CloudFront?

- Szybkość i niezawodność w dostarczaniu treści do klientów
- Bezpieczeństwo
- Głęboka i łatwa integracja z ekosystemem AWS
- Wygodna konfiguracja za pomocą API/SDK/narzędzi IaC np. Terraform, Serverless framework
- Przetwarzanie żądań i odpowiedzi @Edge za pomocą kodu AWS Lambda Edge Functions, CloudFront Functions
- Metryki i logi dostępne w czasie rzeczywistym

#### Wady i zalety Generatorów

*Pros*
- Kontrakt API to źródło prawdy dla aplikacji na froncie
- Poprawne typy
- Uderzamy do właściwych endpointów API
- Używamy prawidłowych parametrów
- Jeśli gdzieś jest błąd to najpewniej na backendzie
- Z łatwością interpretujemy response requestu
- Z łatwością jesteśmy w stanie zweryfikować zmiany, które nastąpiły w API
- [typescript] Błędy w czasie kompilacji kodu, a nie w runtime
- Oszczędność czasu, nie musimy się martwić refactorem, martwym kodem, naprawą błędów, niepoprawnymi typami
- Mamy świadomość, że nasz codebase, a przynajmniej codebase naszego API jest niezawodny :)

*Cons*
- Raczej dla małych teamów 
  - Konieczność przeładowania/ponownej generacji typów i clienta http przy zmianie kontraktu przez backend
- Może być uciążliwe dla dużych zespołów
  - [solution] Paczka z typami i clientem mogłaby być wystawiana zaraz obok nowej wersji backendu (integracja CI/CD)


#### Do poczytania / Linki

- https://react-typescript-cheatsheet.netlify.app
- https://blog.pragmatists.com/generating-a-typescript-api-client-541109422c40
- https://dev.to/wkrueger/integrating-apis-to-a-typescript-frontend-with-openapi-swagger-3521
- https://the-guild.dev/blog/whats-new-in-graphql-codegen-v2
- https://openapi-generator.tech/
- https://tsed.io/

![](https://i.imgur.com/RrzBX7A.png)



----




