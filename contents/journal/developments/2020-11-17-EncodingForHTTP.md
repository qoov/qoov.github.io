---
titlePrefix: Knowledge
title: "Encoding for HTTP"
---

# 자바스크립트의 인코딩과 HTTP 통신

HTTP 통신을 할 때에 한글이나 특수문자는 인코딩 해주어야 한다.

특히 특수문자 중에 대표적인 것은 `#`이 있다.

URI 규칙에서 `#`은 HashTag를 의미하기 때문에 인코딩하고 보내지 않을 경우에 문제가 된다.

아래와 같이 유저들의 정보를 요청하는 API 주소가 있다고 가정을 해보자.

```
http://api.server.com/api/#/users
```

이 경우, URI 규칙에 의해서 HTTP 전송이 되는 것은 `http://api.server.com/api/` 까지만이고, `#/users` 는 HashTag로 인식하게 된다.

이럴 경우에는 `#`을 인코딩해야 올바르게 요청을 할 수 있다.

```javascript
/* psuedo code */
const hashTag = encodeURIComponent("#");
const requestURL = `http://api.server.com/api/${hashTag}/users`;
fetch(requestURL)
  .then((response) => response.json())
  .then(/* your process */);
```

잠깐 이야기를 진행하기에 앞서, 자바스크립트로 브라우저에서 인코딩 작업을 하다보면 `encodeURI` 와 `encodeURIComponent` 함수 두 가지를 볼 수 있다. 이 두 개의 차이는 무엇일까?

## encodeURI

> - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI
> - MDN에서는 정말 깔끔하게 잘 설명하고 있다.

요점만 보자면 `encodeURI` 함수는 URI의 규칙에 명시된 예약 문자 모두를 인코딩(escape)하지 않는다.

대상은 `A-Z a-z 0-9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #` 이 있다. 이 문자들은 URI에서 특별한 의미로 사용하기 때문에 `encodeURI`로는 인코딩(escape) 하지 않는다.

따라서 URI 규칙에 잘 따라서 사용한다면 `encodeURI` 만으로 해결하는 것이 좀더 효율적이고 좋을 수 있다.

그런데 항상 이렇게 쓸 수는 없다. 자주 예외를 볼 수 있는 사례가 `/`과 `?` 그리고 `=` 정도 일 것이다.

가령 경우에 따라서 파라미터에 `/`을 넣어야 할 때가 있다. (_특히 파일명과 디렉토리를 불러올 때요!_)

REST API 호출 방식에 따라 GET을 사용하게끔 만들어진 상태에서 다음과 같은 형태로 디렉토리의 폴더를 가져와야 하는 상황이라고 가정해 보겠다. 그리고 파라미터는 인코딩(escape)해서 보내달라는 요청을 받는다.  
_당연히 아래 예제와는 전혀 다른 방식으로 호출하게끔 만들어도 되지만, 여기에서는 샘플이 필요하기 때문에 아래와 같이 가정한다._

```
http://api.server.com/api/files?directory=home/src
```

이 경우 `home/src`에는 `/`이 있기 때문에 `encodeURI`로 인코딩할 수 없다.

그렇다면 이런 경우에는 좀더 확장성이 있는 `encodeURIComponent`를 활용해야 한다.

## encodeURIComponent

> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
> MDN을 반드시 읽어보는 것이 중요하다.

```javascript
/* psuedo code */
const requestURL = new URL("http://api.server.com/api/users");
const directory = "home/src";

/* 좀더 효율적으로 사용하려면 requestURL.searchParams.append를 하는 시점에서 encodeURIComponent 를 사용 */
const encodedDirectory = encodeURIComponent(directory);
const parameters = { directory: encodedDirectory };

Object.keys(parameters).forEach((key) =>
  requestURL.searchParams.append(key, parameters[key])
);

fetch(requestURL)
  .then((response) => response.json())
  .then(/* your process */);
```

사실 `/`는 그냥 보낸다고 하더라도 별 문제는 되지 않는다. URI 규칙에 의해 `?` 뒤에 있는 `/`는 그저 파라미터의 일부로 인식되기 때문이다. (_물론 숨어있는 위험성은 분명 존재한다. 그 사례는 조금 더 후에 살펴본다._)

하지만 맨 처음의 사례와 결합하여 보았을 때는 분명 문제가 된다. 디렉토리 이름이 `#`인 경우에 이스케이프 처리가 되지 않는다면, 어떻게 될까?

```
http://api.server.com/api/files?directory=#/src
```

첫 사례에서 보았던 것처럼 HTTP 전송은 다음과 같이 될 것이다.

```
# request URL
http://api.server.com/api/files?directory=
# HashTag
/src
```

이렇게 나눠져 보내져 버리기 때문에, API 서버는 비어있는 directory 값을 받게 된다. 이것은 `#`이 어느 위치에 있던지 그 뒤로는 모두 해쉬태그로 인식하게 된다. 따라서 위의 과정을 거쳐서 `#`도 올바르게 인코딩을 해주어야 한다.

디렉토리의 사례를 활용해본 김에 좀더 보도록 하자. 위에서 `encodeURI`는 URI 규칙들을 모두 처리하지 않는다고 하였다. 그렇다면 `encodeURIComponent`는 어떨까?

MDN 문서를 토대로 살펴보았을 때 `encodeURIComponent`는 `A-Z a-z 0-9 - _ . ! ~ * ' ( )`를 제외한 모든 문자를 인코딩한다.

## RFC 3986

그러면 위의 문자열을 제외하고 모두 인코딩처리를 하는 것을 알 수 있다. 하지만 위의 특수기호도 어떻게 될지는 알 수가 없다. 파일의 경우에는 정말 드문 경우일 수도 있겠지만 `*`이나 `!` 등을 인코딩할 필요가 있을지도 모른다. 물론 약속에 의해 `*`를 다른 의미로 활용할 수도 있기 때문에 이 부분은 주의해야 한다. `RFC 3986` 부터는 **서버와의 규칙**에 준하여 고민하면서 적용해야 한다. `RFC 3986`은 퍼센트 인코딩 규약을 정의한 것이다. URL에서 중요하게 사용되는 예약(reserved) 문자가 있고, 또한 인코딩이 필요하지 않은 비예약(unreserved) 문자가 있기 때문에 예약 문자를 인코딩 하는 것에 대한 지침이 필요하여 만들어진 것이다.

그럴 때는 MDN 문서에 나와있는 샘플 코드를 활용하여 인코딩할 수 있다. MDN 문서에는 `fixed`라고 함수의 이름을 표기했지만 좀더 명확하게 하기 위해 `RFC3986`으로 대체하여 작성했다.

```javascript
function encodeURIComponentRFC3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return "%" + c.charCodeAt(0).toString(16);
  });
}

/* psuedo code */
const requestURL = new URL("http://api.server.com/api/users");
const directory = "*/src";

/* 좀더 효율적으로 사용하려면 requestURL.searchParams.append를 하는 시점에서 encodeURIComponentRFC3986 을 사용 */
const encodedDirectory = encodeURIComponentRFC3986(directory);
const parameters = { directory: encodedDirectory };

Object.keys(parameters).forEach((key) =>
  requestURL.searchParams.append(key, parameters[key])
);

fetch(requestURL)
  .then((response) => response.json())
  .then(/* your process */);
```

> 거치는 서버가 한대만이 아닐 수도 있다. 특히 URL에 Redirect URL 파라미터를 통해 거쳐가는 경우에는!

특수한 경우를 제외하고는 특수 문자를 그대로 날렸을 때 이상없는 경우가 대부분이긴 하다다. `#`의 경우에는 처리를 해줄 필요가 분명 있지만, `*`의 경우에 서버들 사이에서 별 다른 처리를 하지 않아도 해결이 된다면 다행이지만, `*`이 특별한 의미를 가지게 된 경우라면, 혹은 파라미터를 제외한 도메인에 위치해 있다면, 특히 Redirect URL 파라미터에 포함되어 있다면 상황을 살펴보고 인코딩을 해야할지 잘 판단해야 한다.
