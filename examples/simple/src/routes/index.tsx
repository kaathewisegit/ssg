import { Head as SiteHead, Layout } from "../components/layout"

export function Head(_params: undefined, _body: string) {
	return <SiteHead title="Home" />
}

export function Body() {
	return (
		<Layout>
			<main>
				<h1>Hello, world!</h1>
				<p>
					This is a dummy site used to test the static site generator. Check
					out the <a href="/about">about page</a>.
				</p>
			</main>
		</Layout>
	)
}
