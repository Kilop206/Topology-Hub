package com.userex.hub;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class Bootstrap {

  @ConfigProperty(name = "hub.admin-email")
  Optional<String> email;

  @ConfigProperty(name = "hub.admin-password")
  Optional<String> password;

  @Transactional
  void start(@Observes StartupEvent event) {
    if (email.isEmpty() && password.isEmpty()) return;
    if (
      email.isEmpty() ||
      password.isEmpty() ||
      !email.get().contains("@") ||
      password.get().length() < 12
    ) throw new IllegalStateException(
      "Configure HUB_ADMIN_EMAIL e HUB_ADMIN_PASSWORD (12 caracteres ou mais)."
    );
    AuthResource.password(password.get());
    if (User.byEmail(AuthResource.normalize(email.get())) != null) return;
    var admin = new User();
    admin.email = AuthResource.normalize(email.get());
    admin.displayName = "Administrador";
    admin.passwordHash = BcryptUtil.bcryptHash(password.get());
    admin.role = "ADMIN";
    admin.persist();
  }
}
