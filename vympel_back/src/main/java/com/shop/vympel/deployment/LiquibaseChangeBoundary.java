package com.shop.vympel.deployment;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class LiquibaseChangeBoundary {
    private static final String MASTER_CHANGELOG = "db/changelog/db.changelog-master.xml";

    public ChangeIdentity expectedLatestChange() {
        try {
            List<String> changelogs = includedChangelogs();
            String latestPath = changelogs.get(changelogs.size() - 1);
            List<ChangeIdentity> changes = changesIn(latestPath);
            return changes.get(changes.size() - 1);
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not derive the latest Liquibase changeset", ex);
        }
    }

    public Set<ChangeIdentity> packagedChanges() {
        try {
            Set<ChangeIdentity> changes = new LinkedHashSet<>();
            for (String changelog : includedChangelogs()) {
                changes.addAll(changesIn(changelog));
            }
            return Set.copyOf(changes);
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Could not derive packaged Liquibase changesets", ex);
        }
    }

    private List<String> includedChangelogs() throws Exception {
        Document master = read(MASTER_CHANGELOG);
        NodeList includes = master.getElementsByTagNameNS("*", "include");
        if (includes.getLength() == 0) {
            throw new IllegalStateException("Liquibase master changelog has no includes");
        }
        List<String> paths = new ArrayList<>(includes.getLength());
        for (int index = 0; index < includes.getLength(); index++) {
            String path = ((Element) includes.item(index)).getAttribute("file");
            if (path.isBlank()) {
                throw new IllegalStateException("Liquibase master changelog has an empty include");
            }
            paths.add(path);
        }
        return paths;
    }

    private List<ChangeIdentity> changesIn(String path) throws Exception {
        Document changelog = read(path);
        NodeList nodes = changelog.getElementsByTagNameNS("*", "changeSet");
        if (nodes.getLength() == 0) {
            throw new IllegalStateException("Liquibase changelog has no changesets: " + path);
        }
        List<ChangeIdentity> changes = new ArrayList<>(nodes.getLength());
        for (int index = 0; index < nodes.getLength(); index++) {
            Element change = (Element) nodes.item(index);
            String id = change.getAttribute("id");
            String author = change.getAttribute("author");
            if (id.isBlank() || author.isBlank()) {
                throw new IllegalStateException("Liquibase changeset has no id or author: " + path);
            }
            changes.add(new ChangeIdentity(id, author, path));
        }
        return changes;
    }

    private Document read(String classpathLocation) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        factory.setXIncludeAware(false);
        factory.setExpandEntityReferences(false);
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        try (InputStream input = new ClassPathResource(classpathLocation).getInputStream()) {
            return factory.newDocumentBuilder().parse(input);
        }
    }

    public record ChangeIdentity(String id, String author, String filename) {
    }
}
